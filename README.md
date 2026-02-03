# Dashboard_LB

Automated daily sync of SharePoint sales data to Neon PostgreSQL for a catering company dashboard.

## What it does

- Authenticates to Microsoft Graph using **client credentials**
- Downloads `sales.xlsx` from SharePoint (5-branch catering sales data)
- Parses Excel rows and upserts into a structured `sales` table in Neon
- Tracks sync history in `sync_log`
- Runs **daily at 03:00 UTC** via GitHub Actions (+ supports manual runs)

## Database schema

### `sales` table
Matches your SharePoint Excel columns:
- `branch`, `sale_date`, `client`, `items`, `qty`, `unit_of_measure`
- `unit_price_usd`, `price_subtotal_with_tax`, `price_subtotal_with_tax_usd`
- `rate`, `invoice_number`, `guest_number`, `table_number`, `month`, `tax`
- `category`, `group_name`, `barcode`
- Plus: `id`, `source_row_hash` (deduplication), `created_at`, `updated_at`, `last_synced_at`

### `sync_log` table
Tracks each sync run (rows processed, inserted, updated, status, errors).

## Setup (one-time)

### 1) Azure App Registration permissions
In Azure App Registration for your client id:
- Add **Application** permission: `Sites.Read.All`
- Click **Grant admin consent**

### 2) GitHub Secrets
In GitHub: **Repo → Settings → Secrets and variables → Actions → New repository secret**

Add:
- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `SP_HOSTNAME` (e.g. `mikanacatering.sharepoint.com`)
- `SP_SITE_PATH` (e.g. `/sites/MikanaHO`)
- `SP_FILE_PATH` (e.g. `Mikana LB/Odoo Reports/sales.xlsx`)
- `NEON_DATABASE_URL` (Postgres connection string starting with `postgresql://...`)

### 3) Run the workflow
GitHub → **Actions** → **Sync SharePoint sales.xlsx to Neon** → **Run workflow**

## Query examples

```sql
-- Total sales by branch
SELECT branch, COUNT(*), SUM(price_subtotal_with_tax_usd)
FROM sales
GROUP BY branch
ORDER BY SUM(price_subtotal_with_tax_usd) DESC;

-- Sales by category this month
SELECT category, COUNT(*), SUM(qty)
FROM sales
WHERE month = 'February'
GROUP BY category;

-- Recent sync history
SELECT * FROM sync_log ORDER BY synced_at DESC LIMIT 10;
```
