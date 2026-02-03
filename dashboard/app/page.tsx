import { DollarSign, ShoppingCart, TrendingUp, Building2 } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { BranchChart } from '@/components/charts/BranchChart';
import { CategoryChart } from '@/components/charts/CategoryChart';
import { TopItemsChart } from '@/components/charts/TopItemsChart';
import { formatCurrency, formatNumber } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getOverviewData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const res = await fetch(`${baseUrl}/api/overview`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Failed to fetch overview:', res.statusText);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching overview:', error);
    return null;
  }
}

async function getTrendsData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const res = await fetch(`${baseUrl}/api/trends?days=30`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Error fetching trends:', error);
    return [];
  }
}

async function getBranchesData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const res = await fetch(`${baseUrl}/api/branches`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Error fetching branches:', error);
    return [];
  }
}

async function getCategoriesData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const res = await fetch(`${baseUrl}/api/categories`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

async function getTopItemsData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const res = await fetch(`${baseUrl}/api/top-items?limit=10`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Error fetching top items:', error);
    return [];
  }
}

export default async function HomePage() {
  const [overview, trends, branches, categories, topItems] = await Promise.all([
    getOverviewData(),
    getTrendsData(),
    getBranchesData(),
    getCategoriesData(),
    getTopItemsData(),
  ]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(overview?.totalRevenue || 0)}
          change={overview?.revenueChange}
          icon={DollarSign}
        />
        <KPICard
          title="Total Orders"
          value={formatNumber(overview?.totalOrders || 0)}
          change={overview?.ordersChange}
          icon={ShoppingCart}
        />
        <KPICard
          title="Average Order Value"
          value={formatCurrency(overview?.averageOrderValue || 0)}
          icon={TrendingUp}
        />
        <KPICard
          title="Top Branch"
          value={overview?.topBranch || 'N/A'}
          icon={Building2}
          description="Highest revenue"
        />
      </div>

      {/* Revenue Trend */}
      <RevenueChart data={trends} title="Revenue Trend (Last 30 Days)" />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BranchChart data={branches} />
        <CategoryChart data={categories} />
      </div>

      {/* Top Items */}
      <TopItemsChart data={topItems} />
    </div>
  );
}
