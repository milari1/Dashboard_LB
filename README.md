# Dashboard_LB

This repo contains a scheduled GitHub Action that downloads a SharePoint-hosted Excel file (`sales.xlsx`) via Microsoft Graph and upserts its rows into a Neon (PostgreSQL) database.

## What it does

- Authenticates to Microsoft Graph using **client credentials**.
- Resolves your SharePoint **site** and its default **Documents** drive.
- Downloads an Excel file by path.
- Reads every sheet and stores rows into Neon as JSON (`sales_xlsx_rows`).
- Runs **daily** via GitHub Actions and supports **manual** runs.

## Required GitHub Secrets

In GitHub: **Repo → Settings → Secrets and variables → Actions → New repository secret**

Add:

- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `SP_HOSTNAME` (example: `mikanacatering.sharepoint.com`)
- `SP_SITE_PATH` (example: `/sites/MikanaHO`)
- `SP_FILE_PATH` (example: `Mikana LB/Odoo Reports/sales.xlsx`)
- `NEON_DATABASE_URL` (Neon Postgres connection string)

## Azure app permissions (one-time)

In Azure App Registration for your client id:
- Add **Application** permission: `Sites.Read.All`
- Click **Grant admin consent**

## Notes

- The script auto-creates tables `sales_xlsx_imports` and `sales_xlsx_rows` on first run.
- Once you confirm your Excel column names, you can build a clean relational `sales` table/view from `sales_xlsx_rows.data`.
