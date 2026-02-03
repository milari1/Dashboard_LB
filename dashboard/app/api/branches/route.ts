import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { BranchMetrics } from '@/lib/types';

export const revalidate = 300;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause = 'WHERE branch IS NOT NULL';
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

    const result = await sql.query(
      `SELECT 
        branch,
        COALESCE(SUM(price_subtotal_with_tax_usd), 0) as revenue,
        COUNT(*) as orders,
        COALESCE(AVG(price_subtotal_with_tax_usd), 0) as avg_order_value
      FROM sales ${whereClause}
      GROUP BY branch
      ORDER BY revenue DESC`,
      params
    );

    // Get top item for each branch
    const branchesWithTopItems = await Promise.all(
      result.rows.map(async (row) => {
        const topItemResult = await sql.query(
          `SELECT items, SUM(qty) as total_qty
          FROM sales
          WHERE branch = $1 AND items IS NOT NULL ${startDate ? 'AND sale_date >= $2' : ''} ${endDate ? `AND sale_date <= $${startDate ? 3 : 2}` : ''}
          GROUP BY items
          ORDER BY total_qty DESC
          LIMIT 1`,
          startDate && endDate ? [row.branch, startDate, endDate] : startDate ? [row.branch, startDate] : [row.branch]
        );

        return {
          branch: row.branch,
          revenue: Number(row.revenue),
          orders: Number(row.orders),
          averageOrderValue: Number(row.avg_order_value),
          topItem: topItemResult.rows[0]?.items || null,
        } as BranchMetrics;
      })
    );

    return NextResponse.json(branchesWithTopItems);
  } catch (error) {
    console.error('Error fetching branch metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branch metrics' },
      { status: 500 }
    );
  }
}
