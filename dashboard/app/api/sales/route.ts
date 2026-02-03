import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const revalidate = 0; // Don't cache this endpoint

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const branches = searchParams.get('branches')?.split(',').filter(Boolean);
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

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
    if (search) {
      whereClause += ` AND (
        items ILIKE $${paramIndex} OR 
        client ILIKE $${paramIndex} OR 
        invoice_number ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await sql.query(
      `SELECT COUNT(*) as total FROM sales ${whereClause}`,
      params
    );

    const total = Number(countResult.rows[0].total);

    // Get paginated data
    params.push(limit, offset);
    const result = await sql.query(
      `SELECT 
        id, branch, sale_date, client, items, qty, unit_of_measure,
        unit_price_usd, price_subtotal_with_tax_usd, invoice_number,
        category, month
      FROM sales ${whereClause}
      ORDER BY sale_date DESC, id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return NextResponse.json({
      sales: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}
