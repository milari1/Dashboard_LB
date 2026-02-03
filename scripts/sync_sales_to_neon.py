import hashlib
import json
import os
import sys
import tempfile
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

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
    if resp.status_code != 200:
        try:
            details = resp.json()
        except Exception:
            details = {"raw": resp.text}
        raise RuntimeError(f"Token request failed: {resp.status_code} {details}")
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
    url = f"https://graph.microsoft.com/v1.0/sites/{hostname}:{site_path}"
    data = graph_get(token, url)
    return data["id"]


def resolve_default_drive_id(token: str, site_id: str) -> str:
    url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive"
    data = graph_get(token, url)
    return data["id"]


def drive_item_urls(drive_id: str, file_path: str) -> Tuple[str, str]:
    encoded_path = quote(file_path.strip("/"), safe="/")
    base = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{encoded_path}"
    return base, f"{base}:/content"


def _normalize_value(value: Any) -> Any:
    """Convert pandas/numpy types to Python native types."""
    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except Exception:
        pass

    if isinstance(value, pd.Timestamp):
        return value.to_pydatetime()

    if isinstance(value, (datetime, date)):
        return value

    try:
        import numpy as np
        if isinstance(value, np.generic):
            return value.item()
    except Exception:
        pass

    return value


def row_to_dict(row: pd.Series) -> Dict[str, Any]:
    """Convert a pandas row to a dict with normalized values."""
    return {str(k): _normalize_value(v) for k, v in row.items()}


def row_hash(row_dict: Dict[str, Any]) -> str:
    """Generate a stable hash for deduplication."""
    canonical = json.dumps(row_dict, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def ensure_tables(conn) -> None:
    """Create sales table and sync_log if they don't exist."""
    with conn.cursor() as cur:
        cur.execute(
            """
            -- Drop old generic tables if they exist
            DROP TABLE IF EXISTS sales_xlsx_rows CASCADE;
            DROP TABLE IF EXISTS sales_xlsx_imports CASCADE;

            -- Create the sales table
            CREATE TABLE IF NOT EXISTS sales (
              id                              BIGSERIAL PRIMARY KEY,
              branch                          TEXT,
              sale_date                       DATE,
              client                          TEXT,
              items                           TEXT,
              qty                             NUMERIC(12, 3),
              unit_of_measure                 TEXT,
              unit_price_usd                  NUMERIC(12, 2),
              price_subtotal_with_tax         NUMERIC(12, 2),
              price_subtotal_with_tax_usd     NUMERIC(12, 2),
              rate                            NUMERIC(12, 4),
              invoice_number                  TEXT,
              guest_number                    TEXT,
              table_number                    TEXT,
              month                           TEXT,
              tax                             NUMERIC(12, 2),
              category                        TEXT,
              group_name                      TEXT,
              barcode                         TEXT,
              
              source_row_hash                 TEXT UNIQUE NOT NULL,
              last_synced_at                  TIMESTAMPTZ DEFAULT now(),
              created_at                      TIMESTAMPTZ DEFAULT now(),
              updated_at                      TIMESTAMPTZ DEFAULT now()
            );

            CREATE INDEX IF NOT EXISTS sales_branch_idx ON sales(branch);
            CREATE INDEX IF NOT EXISTS sales_date_idx ON sales(sale_date);
            CREATE INDEX IF NOT EXISTS sales_invoice_idx ON sales(invoice_number);
            CREATE INDEX IF NOT EXISTS sales_category_idx ON sales(category);
            CREATE INDEX IF NOT EXISTS sales_month_idx ON sales(month);

            CREATE TABLE IF NOT EXISTS sync_log (
              id                BIGSERIAL PRIMARY KEY,
              synced_at         TIMESTAMPTZ DEFAULT now(),
              rows_processed    INT NOT NULL DEFAULT 0,
              rows_inserted     INT NOT NULL DEFAULT 0,
              rows_updated      INT NOT NULL DEFAULT 0,
              file_etag         TEXT,
              file_modified     TIMESTAMPTZ,
              status            TEXT NOT NULL DEFAULT 'success',
              error_message     TEXT
            );
            """
        )
    conn.commit()


def map_excel_to_db(excel_row: Dict[str, Any]) -> Dict[str, Any]:
    """Map Excel column names to database column names."""
    # Excel columns (as they appear in your file)
    return {
        "branch": excel_row.get("Branch"),
        "sale_date": excel_row.get("Date"),
        "client": excel_row.get("Client"),
        "items": excel_row.get("Items"),
        "qty": excel_row.get("Qty"),
        "unit_of_measure": excel_row.get("Unit of Measure"),
        "unit_price_usd": excel_row.get("Unit Price $"),
        "price_subtotal_with_tax": excel_row.get("Price Subtotal with Tax"),
        "price_subtotal_with_tax_usd": excel_row.get("Price Subtotal with Tax $"),
        "rate": excel_row.get("Rate"),
        "invoice_number": excel_row.get("Invoice Number"),
        "guest_number": excel_row.get("Guest Number"),
        "table_number": excel_row.get("Table Number"),
        "month": excel_row.get("Month"),
        "tax": excel_row.get("Tax"),
        "category": excel_row.get("Category"),
        "group_name": excel_row.get("Group"),
        "barcode": excel_row.get("Barcode"),
    }


def upsert_sales_row(conn, db_row: Dict[str, Any], source_hash: str) -> bool:
    """
    Insert or update a sales row.
    Returns True if inserted, False if updated.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO sales (
              branch, sale_date, client, items, qty, unit_of_measure,
              unit_price_usd, price_subtotal_with_tax, price_subtotal_with_tax_usd,
              rate, invoice_number, guest_number, table_number, month, tax,
              category, group_name, barcode, source_row_hash
            )
            VALUES (
              %(branch)s, %(sale_date)s, %(client)s, %(items)s, %(qty)s, %(unit_of_measure)s,
              %(unit_price_usd)s, %(price_subtotal_with_tax)s, %(price_subtotal_with_tax_usd)s,
              %(rate)s, %(invoice_number)s, %(guest_number)s, %(table_number)s, %(month)s, %(tax)s,
              %(category)s, %(group_name)s, %(barcode)s, %(source_row_hash)s
            )
            ON CONFLICT (source_row_hash)
            DO UPDATE SET
              branch = EXCLUDED.branch,
              sale_date = EXCLUDED.sale_date,
              client = EXCLUDED.client,
              items = EXCLUDED.items,
              qty = EXCLUDED.qty,
              unit_of_measure = EXCLUDED.unit_of_measure,
              unit_price_usd = EXCLUDED.unit_price_usd,
              price_subtotal_with_tax = EXCLUDED.price_subtotal_with_tax,
              price_subtotal_with_tax_usd = EXCLUDED.price_subtotal_with_tax_usd,
              rate = EXCLUDED.rate,
              invoice_number = EXCLUDED.invoice_number,
              guest_number = EXCLUDED.guest_number,
              table_number = EXCLUDED.table_number,
              month = EXCLUDED.month,
              tax = EXCLUDED.tax,
              category = EXCLUDED.category,
              group_name = EXCLUDED.group_name,
              barcode = EXCLUDED.barcode,
              last_synced_at = now(),
              updated_at = now()
            RETURNING (xmax = 0) AS inserted
            """,
            {**db_row, "source_row_hash": source_hash},
        )
        result = cur.fetchone()
        return bool(result[0]) if result else True
    

def log_sync(conn, rows_processed: int, rows_inserted: int, rows_updated: int,
             file_etag: Optional[str], file_modified: Optional[str],
             status: str = "success", error_message: Optional[str] = None) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO sync_log (rows_processed, rows_inserted, rows_updated, file_etag, file_modified, status, error_message)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (rows_processed, rows_inserted, rows_updated, file_etag, file_modified, status, error_message),
        )
    conn.commit()


def read_excel_first_sheet(excel_bytes: bytes) -> pd.DataFrame:
    """Read the first sheet of the Excel file."""
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=True) as f:
        f.write(excel_bytes)
        f.flush()
        # Read first sheet only
        df = pd.read_excel(f.name, sheet_name=0)
    return df


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

        excel_bytes = graph_download(token, content_url)
        df = read_excel_first_sheet(excel_bytes)

        print(f"Excel columns found: {list(df.columns)}")
        print(f"Total rows in Excel: {len(df)}")

        rows_processed = 0
        rows_inserted = 0
        rows_updated = 0

        for idx, pandas_row in df.iterrows():
            excel_row = row_to_dict(pandas_row)
            db_row = map_excel_to_db(excel_row)
            source_hash = row_hash(excel_row)

            inserted = upsert_sales_row(conn, db_row, source_hash)
            rows_processed += 1
            if inserted:
                rows_inserted += 1
            else:
                rows_updated += 1

        conn.commit()

        log_sync(conn, rows_processed, rows_inserted, rows_updated, etag, last_modified)

        print(f"✅ Sync complete: {rows_processed} rows processed ({rows_inserted} inserted, {rows_updated} updated)")
        return 0

    except Exception as e:
        try:
            log_sync(conn, 0, 0, 0, None, None, status="error", error_message=str(e))
        except Exception:
            pass
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        raise
