import { DollarSign, ShoppingCart, TrendingUp, Building2 } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { BranchChart } from '@/components/charts/BranchChart';
import { CategoryChart } from '@/components/charts/CategoryChart';
import { TopItemsChart } from '@/components/charts/TopItemsChart';
import { formatCurrency, formatNumber } from '@/lib/db';
import { getOverviewMetrics, getTrends, getBranchMetrics, getCategoryMetrics, getTopItems } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [overview, trends, branches, categories, topItems] = await Promise.all([
    getOverviewMetrics(),
    getTrends(30),
    getBranchMetrics(),
    getCategoryMetrics(),
    getTopItems(10),
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
