-- Drop old generic tables if they exist
DROP TABLE IF EXISTS sales_xlsx_rows CASCADE;
DROP TABLE IF EXISTS sales_xlsx_imports CASCADE;

-- Create the sales table matching your SharePoint Excel structure
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
  
  -- Tracking fields
  source_row_hash                 TEXT UNIQUE NOT NULL,
  last_synced_at                  TIMESTAMPTZ DEFAULT now(),
  created_at                      TIMESTAMPTZ DEFAULT now(),
  updated_at                      TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS sales_branch_idx ON sales(branch);
CREATE INDEX IF NOT EXISTS sales_date_idx ON sales(sale_date);
CREATE INDEX IF NOT EXISTS sales_invoice_idx ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS sales_category_idx ON sales(category);
CREATE INDEX IF NOT EXISTS sales_month_idx ON sales(month);

-- Import log table (tracks each sync run)
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
