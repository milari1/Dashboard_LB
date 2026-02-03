# 🚀 Quick Setup Guide

## Step 1: Configure Database Connection

Create a `.env.local` file in the `dashboard` directory:

```bash
cd dashboard
```

Create the file with your Neon database connection string:

```env
POSTGRES_URL="your_neon_connection_string_here"
DATABASE_URL="your_neon_connection_string_here"
```

### Where to find your Neon connection string:

1. Go to your [Neon Console](https://console.neon.tech/)
2. Select your project
3. Click on "Connection Details"
4. Copy the connection string (it starts with `postgresql://`)
5. Make sure it includes `?sslmode=require` at the end

Example:
```
postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Step 2: Run the Development Server

```bash
npm run dev
```

## Step 3: Open Your Browser

Navigate to: **http://localhost:3000**

You should see your dashboard with:
- ✅ KPI metrics
- ✅ Revenue charts
- ✅ Branch performance
- ✅ Sales data

## Troubleshooting

### "Failed to connect to database"
- Double-check your connection string in `.env.local`
- Ensure your Neon database is active
- Verify the `sales` table exists and has data

### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then run `npm install`

### Port 3000 already in use
- Use a different port: `npm run dev -- -p 3001`
- Or kill the process using port 3000

## Testing the Dashboard

Once running, you can:

1. **View Overview**: See total revenue, orders, and trends
2. **Check Branches**: Compare performance across all 5 branches
3. **Analyze Sales**: View category breakdowns and top items
4. **Browse Data**: Search and export sales records
5. **View Reports**: Access report templates (coming soon)

## Next Steps

1. Test all pages to ensure data loads correctly
2. Try the filter functionality
3. Export data from the Data Table page
4. Prepare for Vercel deployment (see README.md)

---

Need help? Check the main README.md file for detailed documentation.
