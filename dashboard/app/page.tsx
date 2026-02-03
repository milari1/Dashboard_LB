import { DollarSign, ShoppingCart, TrendingUp, Building2 } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { BranchChart } from '@/components/charts/BranchChart';
import { CategoryChart } from '@/components/charts/CategoryChart';
import { TopItemsChart } from '@/components/charts/TopItemsChart';
import { formatCurrency, formatNumber } from '@/lib/db';

async function getOverviewData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/overview`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

async function getTrendsData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/trends?days=30`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

async function getBranchesData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/branches`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

async function getCategoriesData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/categories`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

async function getTopItemsData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/top-items?limit=10`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
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
