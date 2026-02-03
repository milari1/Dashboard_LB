import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { TrendData } from '@/lib/types';

export const revalidate = 300;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const branches = searchParams.get('branches')?.split(',').filter(Boolean);

    let whereClause = 'WHERE sale_date IS NOT NULL';
    const params: any[] = [days];
    let paramIndex = 2;

    if (branches && branches.length > 0) {
      whereClause += ` AND branch = ANY($${paramIndex})`;
      params.push(branches);
      paramIndex++;
    }

    const result = await sql.query(
      `SELECT 
        sale_date::date as date,
        COALESCE(SUM(price_subtotal_with_tax_usd), 0) as revenue,
        COUNT(*) as orders
      FROM sales 
      ${whereClause}
      AND sale_date >= CURRENT_DATE - INTERVAL '1 day' * $1
      GROUP BY sale_date::date
      ORDER BY date ASC`,
      params
    );

    const trends: TrendData[] = result.rows.map(row => ({
      date: row.date,
      revenue: Number(row.revenue),
      orders: Number(row.orders),
    }));

    return NextResponse.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}
