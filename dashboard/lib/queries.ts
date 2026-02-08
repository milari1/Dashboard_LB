import { sql } from '@vercel/postgres';
import { calculatePercentageChange, getCurrentMonth, getPreviousMonth } from './utils';

export async function getOverviewMetrics() {
  try {
    const currentMonth = getCurrentMonth();
    const previousMonth = getPreviousMonth();

    const [currentMetrics, previousMetrics, topBranchQuery] = await Promise.all([
      sql`SELECT 
        COALESCE(SUM(price_subtotal_with_tax_usd), 0) as total_revenue,
        COUNT(*) as total_orders,
        COALESCE(AVG(price_subtotal_with_tax_usd), 0) as avg_order_value
      FROM sales`,

      sql`SELECT 
        COALESCE(SUM(price_subtotal_with_tax_usd), 0) as total_revenue,
        COUNT(*) as total_orders
      FROM sales 
      WHERE month = ${previousMonth}`,

      sql`SELECT branch, COALESCE(SUM(price_subtotal_with_tax_usd), 0) as revenue
      FROM sales
      WHERE branch IS NOT NULL
      GROUP BY branch
      ORDER BY revenue DESC
      LIMIT 1`,
    ]);

    const current = currentMetrics.rows[0];
    const previous = previousMetrics.rows[0];

    return {
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
  } catch (error) {
    console.error('Error fetching overview metrics:', error);
    return null;
  }
}

export async function getTrends(days: number = 30) {
  try {
    const result = await sql`
      SELECT 
        sale_date::date as date,
        COALESCE(SUM(price_subtotal_with_tax_usd), 0) as revenue,
        COUNT(*) as orders
      FROM sales 
      WHERE sale_date IS NOT NULL
        AND sale_date >= CURRENT_DATE - CAST(${days} || ' days' AS INTERVAL)
      GROUP BY sale_date::date
      ORDER BY date ASC`;

    return result.rows.map(row => ({
      date: row.date,
      revenue: Number(row.revenue),
      orders: Number(row.orders),
    }));
  } catch (error) {
    console.error('Error fetching trends:', error);
    return [];
  }
}

export async function getBranchMetrics() {
  try {
    const result = await sql`
      SELECT 
        branch,
        COALESCE(SUM(price_subtotal_with_tax_usd), 0) as revenue,
        COUNT(*) as orders,
        COALESCE(AVG(price_subtotal_with_tax_usd), 0) as avg_order_value
      FROM sales
      WHERE branch IS NOT NULL
      GROUP BY branch
      ORDER BY revenue DESC`;

    const branches = await Promise.all(
      result.rows.map(async (row) => {
        const topItem = await sql`
          SELECT items, SUM(qty) as total_qty
          FROM sales
          WHERE branch = ${row.branch} AND items IS NOT NULL
          GROUP BY items
          ORDER BY total_qty DESC
          LIMIT 1`;

        return {
          branch: row.branch,
          revenue: Number(row.revenue),
          orders: Number(row.orders),
          averageOrderValue: Number(row.avg_order_value),
          topItem: topItem.rows[0]?.items || null,
        };
      })
    );

    return branches;
  } catch (error) {
    console.error('Error fetching branch metrics:', error);
    return [];
  }
}

export async function getCategoryMetrics() {
  try {
    const result = await sql`
      SELECT 
        category,
        COALESCE(SUM(price_subtotal_with_tax_usd), 0) as revenue,
        COALESCE(SUM(qty), 0) as quantity,
        COUNT(*) as orders
      FROM sales
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY revenue DESC
      LIMIT 10`;

    return result.rows.map(row => ({
      category: row.category,
      revenue: Number(row.revenue),
      quantity: Number(row.quantity),
      orders: Number(row.orders),
    }));
  } catch (error) {
    console.error('Error fetching category metrics:', error);
    return [];
  }
}

export async function getTopItems(limit: number = 10) {
  try {
    const result = await sql`
      SELECT 
        items as item,
        COALESCE(SUM(qty), 0) as quantity,
        COALESCE(SUM(price_subtotal_with_tax_usd), 0) as revenue,
        COUNT(*) as orders
      FROM sales
      WHERE items IS NOT NULL
      GROUP BY items
      ORDER BY quantity DESC
      LIMIT ${limit}`;

    return result.rows.map(row => ({
      item: row.item,
      quantity: Number(row.quantity),
      revenue: Number(row.revenue),
      orders: Number(row.orders),
    }));
  } catch (error) {
    console.error('Error fetching top items:', error);
    return [];
  }
}
