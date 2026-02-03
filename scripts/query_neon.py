"""
Quick script to query your Neon database locally.
Usage: python scripts/query_neon.py
"""
import os
import sys

import psycopg2
import psycopg2.extras


def main():
    db_url = os.getenv("NEON_DATABASE_URL")
    if not db_url:
        print("ERROR: Set NEON_DATABASE_URL environment variable")
        print("Example (PowerShell):")
        print('  $env:NEON_DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"')
        return 1

    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Check tables
            print("=== Tables in database ===")
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """)
            for row in cur.fetchall():
                print(f"  - {row['table_name']}")

            # Count sales
            print("\n=== Sales count ===")
            cur.execute("SELECT COUNT(*) as count FROM sales")
            count = cur.fetchone()
            print(f"  Total rows: {count['count']}")

            # Recent sales
            print("\n=== Recent 5 sales ===")
            cur.execute("""
                SELECT branch, sale_date, client, items, 
                       price_subtotal_with_tax_usd, invoice_number
                FROM sales 
                ORDER BY sale_date DESC NULLS LAST, id DESC
                LIMIT 5
            """)
            for row in cur.fetchall():
                print(f"  {row['sale_date']} | {row['branch']} | {row['client']} | ${row['price_subtotal_with_tax_usd']} | {row['invoice_number']}")

            # Sync log
            print("\n=== Recent sync runs ===")
            cur.execute("""
                SELECT synced_at, rows_processed, rows_inserted, rows_updated, status
                FROM sync_log
                ORDER BY synced_at DESC
                LIMIT 5
            """)
            for row in cur.fetchall():
                print(f"  {row['synced_at']} | {row['status']} | processed={row['rows_processed']} inserted={row['rows_inserted']} updated={row['rows_updated']}")

    finally:
        conn.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
