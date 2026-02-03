import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { CategoryMetrics } from '@/lib/types';

export const revalidate = 300;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const branches = searchParams.get('branches')?.split(',').filter(Boolean);

    let whereClause = 'WHERE category IS NOT NULL';
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

    const result = await sql.query(
      `SELECT 
        category,
        COALESCE(SUM(price_subtotal_with_tax_usd), 0) as revenue,
        COALESCE(SUM(qty), 0) as quantity,
        COUNT(*) as orders
      FROM sales ${whereClause}
      GROUP BY category
      ORDER BY revenue DESC
      LIMIT 10`,
      params
    );

    const categories: CategoryMetrics[] = result.rows.map(row => ({
      category: row.category,
      revenue: Number(row.revenue),
      quantity: Number(row.quantity),
      orders: Number(row.orders),
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching category metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category metrics' },
      { status: 500 }
    );
  }
}
