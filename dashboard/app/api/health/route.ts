import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test database connection
    await sql`SELECT 1 as test`;
    
    // Check if sales table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sales'
      );
    `;
    
    const tableExists = tableCheck.rows[0]?.exists || false;
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      tableExists,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
