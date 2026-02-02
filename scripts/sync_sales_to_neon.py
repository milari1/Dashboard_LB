import hashlib
import json
import os
import sys
import tempfile
from datetime import datetime
from typing import Any, Dict, Iterable, Optional, Tuple

import pandas as pd
import psycopg2
import psycopg2.extras
import requests
from requests.utils import quote


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


def get_graph_token(tenant_id: str, client_id: str, client_secret: str) -> str:
    url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "client_credentials",
        "scope": "https://graph.microsoft.com/.default",
    }
    resp = requests.post(url, data=data, timeout=60)
    resp.raise_for_status()
    return resp.json()["access_token"]


def graph_get(token: str, url: str) -> Dict[str, Any]:
    resp = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=60)
    resp.raise_for_status()
    return resp.json()


def graph_download(token: str, url: str) -> bytes:
    resp = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=300)
    resp.raise_for_status()
    return resp.content


def resolve_site_id(token: str, hostname: str, site_path: str) -> str:
    # Example: https://graph.microsoft.com/v1.0/sites/mikanacatering.sharepoint.com:/sites/MikanaHO
    url = f"https://graph.microsoft.com/v1.0/sites/{hostname}:{site_path}"
    data = graph_get(token, url)
    return data["id"]


def resolve_default_drive_id(token: str, site_id: str) -> str:
    # Default document library for the site
    url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive"
    data = graph_get(token, url)
    return data["id"]


def drive_item_urls(drive_id: str, file_path: str) -> Tuple[str, str]:
    # file_path is relative to the document library root.
    # Keep slashes but URL-encode spaces and special chars.
    encoded_path = quote(file_path.strip("/"), safe="/")
    base = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{encoded_path}"
    return base, f"{base}:/content"


def canonical_row_json(row: Dict[str, Any]) -> str:
    # Normalize types for hashing/storage.
    def _default(o: Any) -> str:
        if isinstance(o, datetime):
            return o.isoformat()
        return str(o)

    return json.dumps(row, sort_keys=True, ensure_ascii=False, default=_default)


def row_hash(row_json: str) -> str:
    return hashlib.sha256(row_json.encode("utf-8")).hexdigest()


def ensure_tables(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS sales_xlsx_imports (
              id                  BIGSERIAL PRIMARY KEY,
              imported_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
              source_file_path    TEXT NOT NULL,
              etag                TEXT,
              file_last_modified  TIMESTAMPTZ
            );

            CREATE TABLE IF NOT EXISTS sales_xlsx_rows (
              row_hash     TEXT PRIMARY KEY,
              import_id    BIGINT NOT NULL REFERENCES sales_xlsx_imports(id) ON DELETE CASCADE,
              sheet_name   TEXT NOT NULL,
              row_index    INT NOT NULL,
              data         JSONB NOT NULL,
              created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
              updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
            );

            CREATE INDEX IF NOT EXISTS sales_xlsx_rows_import_id_idx ON sales_xlsx_rows(import_id);
            """
        )
    conn.commit()


def get_latest_etag(conn, source_file_path: str) -> Optional[str]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT etag
            FROM sales_xlsx_imports
            WHERE source_file_path = %s
            ORDER BY imported_at DESC
            LIMIT 1
            """,
            (source_file_path,),
        )
        row = cur.fetchone()
        return row[0] if row else None


def insert_import(conn, source_file_path: str, etag: Optional[str], file_last_modified: Optional[str]) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO sales_xlsx_imports (source_file_path, etag, file_last_modified)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (source_file_path, etag, file_last_modified),
        )
        import_id = cur.fetchone()[0]
    conn.commit()
    return int(import_id)


def upsert_rows(conn, import_id: int, sheet_name: str, rows: Iterable[Dict[str, Any]]) -> int:
    count = 0
    with conn.cursor() as cur:
        for idx, row in enumerate(rows):
            row_json = canonical_row_json(row)
            h = row_hash(row_json)
            cur.execute(
                """
                INSERT INTO sales_xlsx_rows (row_hash, import_id, sheet_name, row_index, data)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (row_hash)
                DO UPDATE SET
                  import_id = EXCLUDED.import_id,
                  sheet_name = EXCLUDED.sheet_name,
                  row_index = EXCLUDED.row_index,
                  data = EXCLUDED.data,
                  updated_at = now()
                """,
                (h, import_id, sheet_name, idx, psycopg2.extras.Json(row)),
            )
            count += 1
    conn.commit()
    return count


def excel_to_rows(excel_bytes: bytes) -> Dict[str, list[Dict[str, Any]]]:
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=True) as f:
        f.write(excel_bytes)
        f.flush()
        sheets = pd.read_excel(f.name, sheet_name=None)

    out: Dict[str, list[Dict[str, Any]]] = {}
    for sheet_name, df in sheets.items():
        df = df.where(pd.notnull(df), None)
        out[str(sheet_name)] = df.to_dict(orient="records")
    return out


def main() -> int:
    tenant_id = _required_env("AZURE_TENANT_ID")
    client_id = _required_env("AZURE_CLIENT_ID")
    client_secret = _required_env("AZURE_CLIENT_SECRET")

    hostname = _required_env("SP_HOSTNAME")
    site_path = _required_env("SP_SITE_PATH")
    file_path = _required_env("SP_FILE_PATH")

    db_url = _required_env("NEON_DATABASE_URL")

    token = get_graph_token(tenant_id, client_id, client_secret)

    site_id = resolve_site_id(token, hostname, site_path)
    drive_id = resolve_default_drive_id(token, site_id)

    item_url, content_url = drive_item_urls(drive_id, file_path)
    item = graph_get(token, item_url)

    etag = item.get("eTag")
    last_modified = item.get("lastModifiedDateTime")

    conn = psycopg2.connect(db_url)
    try:
        ensure_tables(conn)

        latest_etag = get_latest_etag(conn, file_path)
        if etag and latest_etag and etag == latest_etag:
            print("No change detected (etag match). Skipping import.")
            return 0

        excel_bytes = graph_download(token, content_url)
        sheets = excel_to_rows(excel_bytes)

        import_id = insert_import(conn, file_path, etag, last_modified)

        total = 0
        for sheet_name, rows in sheets.items():
            total += upsert_rows(conn, import_id, sheet_name, rows)

        print(f"Imported rows: {total} (import_id={import_id})")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        raise
