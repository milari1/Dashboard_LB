# 🍽️ Catering Company Dashboard

A modern, responsive dashboard for managing and visualizing sales data across 5 catering branches. Built with Next.js 14, TypeScript, and Tailwind CSS.

## ✨ Features

### 📊 Overview Dashboard
- Real-time KPI metrics (Revenue, Orders, Average Order Value)
- Interactive revenue trend charts
- Branch performance comparison
- Category breakdown with pie charts
- Top 10 best-selling items

### 🏢 Branch Performance
- Individual branch statistics
- Revenue comparison across branches
- Top-selling items per branch
- Average order values

### 📈 Sales Analytics
- 90-day revenue trends
- Category-wise sales analysis
- Product performance insights
- Quantity and revenue metrics

### 📋 Data Table
- Searchable sales records
- Pagination support
- CSV export functionality
- Filter by date, branch, or search terms

### 📄 Reports
- Pre-configured report templates (Coming Soon)
- Custom date range reports
- Branch performance reports

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Neon PostgreSQL database with the `sales` table already set up
- Database connection string from Neon

### Installation

1. **Navigate to the dashboard directory:**
   ```bash
   cd dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Create a `.env.local` file in the dashboard directory:
   ```bash
   # Copy the example file
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your Neon database connection string:
   ```env
   POSTGRES_URL="postgresql://user:password@host/database?sslmode=require"
   DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
   ```

   > **Note:** You can find your connection string in your Neon dashboard under Connection Details.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

The dashboard expects a `sales` table with the following structure:

```sql
- branch (TEXT)
- sale_date (DATE)
- client (TEXT)
- items (TEXT)
- qty (NUMERIC)
- unit_of_measure (TEXT)
- unit_price_usd (NUMERIC)
- price_subtotal_with_tax_usd (NUMERIC)
- invoice_number (TEXT)
- category (TEXT)
- month (TEXT)
```

The table is automatically synced from your SharePoint using the GitHub Actions workflow.

## 📁 Project Structure

```
dashboard/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── overview/         # KPI metrics
│   │   ├── branches/         # Branch data
│   │   ├── categories/       # Category data
│   │   ├── trends/           # Time-series data
│   │   ├── top-items/        # Best-selling items
│   │   └── sales/            # Sales records (paginated)
│   ├── branches/             # Branch performance page
│   ├── sales/                # Sales analytics page
│   ├── data/                 # Data table page
│   ├── reports/              # Reports page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home/Overview page
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # Base UI components
│   ├── charts/               # Chart components (Recharts)
│   ├── dashboard/            # Dashboard-specific components
│   └── layout/               # Layout components (Sidebar, Header)
├── lib/
│   ├── db.ts                 # Database connection
│   ├── types.ts              # TypeScript types
│   └── utils.ts              # Utility functions
├── public/                   # Static assets
├── .env.local                # Environment variables (create this)
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── package.json              # Dependencies
```

## 🎨 Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Neon PostgreSQL
- **Charts:** Recharts
- **Icons:** Lucide React
- **Deployment:** Vercel (recommended)

## 🌐 API Endpoints

All API endpoints support optional query parameters for filtering:

### `/api/overview`
Returns KPI metrics including total revenue, orders, and changes.

**Query Params:**
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)
- `branches` (optional): Comma-separated branch names

### `/api/branches`
Returns revenue and order metrics for each branch.

### `/api/categories`
Returns sales breakdown by product category.

### `/api/trends?days=30`
Returns daily revenue and order counts.

### `/api/top-items?limit=10`
Returns best-selling items by quantity.

### `/api/sales?page=1&limit=50`
Returns paginated sales records with search support.

## 🚀 Deployment to Vercel

1. **Push your code to GitHub** (if not already done)

2. **Import project in Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your repository
   - Select the `dashboard` directory as the root

3. **Add environment variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add `POSTGRES_URL` with your Neon connection string
   - Add `DATABASE_URL` with the same value
   - Add `NEXT_PUBLIC_BASE_URL` with your deployed URL (optional)

4. **Deploy:**
   - Click "Deploy"
   - Your dashboard will be live at `https://your-project.vercel.app`

## 🔧 Configuration

### Caching
API routes use ISR (Incremental Static Regeneration) with a 5-minute revalidation period:
```typescript
export const revalidate = 300; // 5 minutes
```

### Data Sync
The SharePoint sync runs daily at **12:00 AM UTC** (midnight) via GitHub Actions.

To change the sync schedule, edit `.github/workflows/sync-sales-to-neon.yml`:
```yaml
schedule:
  - cron: "0 0 * * *"  # Daily at midnight UTC
```

## 📊 Features Roadmap

- [ ] Real-time data updates
- [ ] User authentication
- [ ] PDF report generation
- [ ] Email notifications for sales milestones
- [ ] Forecasting and predictions
- [ ] Dark mode
- [ ] Mobile app

## 🐛 Troubleshooting

### "Failed to fetch" errors
- Ensure your `.env.local` file has the correct database connection string
- Verify your database is accessible from your local machine
- Check that the `sales` table exists and has data

### Styling issues
- Clear your browser cache
- Run `npm run dev` again
- Check that Tailwind CSS is properly configured

### Database connection errors
- Ensure your Neon database is active
- Verify your connection string includes `?sslmode=require`
- Check that your IP is whitelisted in Neon (if applicable)

## 📝 License

This project is private and proprietary.

## 🤝 Support

For issues or questions, please contact your system administrator.

---

Built with ❤️ for efficient catering business management
