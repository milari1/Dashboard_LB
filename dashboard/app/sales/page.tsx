import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryChart } from '@/components/charts/CategoryChart';
import { TopItemsChart } from '@/components/charts/TopItemsChart';
import { RevenueChart } from '@/components/charts/RevenueChart';

export const dynamic = 'force-dynamic';

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

async function getTrendsData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/trends?days=90`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function SalesPage() {
  const [categories, topItems, trends] = await Promise.all([
    getCategoriesData(),
    getTopItemsData(),
    getTrendsData(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sales Analytics</h1>
        <p className="text-muted-foreground">
          Detailed analysis of products and sales patterns
        </p>
      </div>

      {/* Revenue Trend */}
      <RevenueChart data={trends} title="Revenue Trend (Last 90 Days)" />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart data={categories} />
        <Card>
          <CardHeader>
            <CardTitle>Category Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.slice(0, 5).map((cat: any, idx: number) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{cat.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {cat.orders} orders • Qty: {Math.round(cat.quantity)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${Number(cat.revenue).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Items */}
      <TopItemsChart data={topItems} />
    </div>
  );
}
