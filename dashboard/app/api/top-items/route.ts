import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { TopItem } from '@/lib/types';

export const revalidate = 300;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const branches = searchParams.get('branches')?.split(',').filter(Boolean);
    const limit = parseInt(searchParams.get('limit') || '10');

    let whereClause = 'WHERE items IS NOT NULL';
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

    params.push(limit);

    const result = await sql.query(
      `SELECT 
        items as item,
        COALESCE(SUM(qty), 0) as quantity,
        COALESCE(SUM(price_subtotal_with_tax_usd), 0) as revenue,
        COUNT(*) as orders
      FROM sales ${whereClause}
      GROUP BY items
      ORDER BY quantity DESC
      LIMIT $${paramIndex}`,
      params
    );

    const topItems: TopItem[] = result.rows.map(row => ({
      item: row.item,
      quantity: Number(row.quantity),
      revenue: Number(row.revenue),
      orders: Number(row.orders),
    }));

    return NextResponse.json(topItems);
  } catch (error) {
    console.error('Error fetching top items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top items' },
      { status: 500 }
    );
  }
}
