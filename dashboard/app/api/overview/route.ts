import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { KPIMetrics } from '@/lib/types';
import { calculatePercentageChange, getCurrentMonth, getPreviousMonth } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Check if database connection is available
    if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
      console.error('Missing database connection string');
      return NextResponse.json(
        { error: 'Database connection not configured. Please set POSTGRES_URL or DATABASE_URL environment variable.' },
        { status: 500 }
      );
    }
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const branches = searchParams.get('branches')?.split(',').filter(Boolean);

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      whereClause += ` AND sale_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      whereClause += ` AND sale_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    if (branches && branches.length > 0) {
      whereClause += ` AND branch = ANY($${paramIndex})`;
      params.push(branches);
      paramIndex++;
    }

    // Current period metrics
    const currentMetrics = await sql.query(
      `SELECT 
        COALESCE(SUM(price_subtotal_with_tax_usd), 0) as total_revenue,
        COUNT(*) as total_orders,
        COALESCE(AVG(price_subtotal_with_tax_usd), 0) as avg_order_value
      FROM sales ${whereClause}`,
      params
    );

    // Previous period metrics for comparison
    const currentMonth = getCurrentMonth();
    const previousMonth = getPreviousMonth();
    
    const previousMetrics = await sql.query(
      `SELECT 
        COALESCE(SUM(price_subtotal_with_tax_usd), 0) as total_revenue,
        COUNT(*) as total_orders
      FROM sales 
      WHERE month = $1`,
      [previousMonth]
    );

    // Top branch
    const topBranchQuery = await sql.query(
      `SELECT branch, COALESCE(SUM(price_subtotal_with_tax_usd), 0) as revenue
      FROM sales ${whereClause}
      GROUP BY branch
      ORDER BY revenue DESC
      LIMIT 1`,
      params
    );

    const current = currentMetrics.rows[0];
    const previous = previousMetrics.rows[0];

    const metrics: KPIMetrics = {
      totalRevenue: Number(current.total_revenue),
      totalOrders: Number(current.total_orders),
      averageOrderValue: Number(current.avg_order_value),
      topBranch: topBranchQuery.rows[0]?.branch || 'N/A',
      revenueChange: calculatePercentageChange(
        Number(current.total_revenue),
        Number(previous.total_revenue)
      ),
      ordersChange: calculatePercentageChange(
        Number(current.total_orders),
        Number(previous.total_orders)
      ),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching overview metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview metrics' },
      { status: 500 }
    );
  }
}
