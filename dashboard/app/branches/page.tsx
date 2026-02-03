import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BranchChart } from '@/components/charts/BranchChart';
import { formatCurrency, formatNumber } from '@/lib/db';
import { Building2, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getBranchesData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/branches`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function BranchesPage() {
  const branches = await getBranchesData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Branch Performance</h1>
        <p className="text-muted-foreground">
          Compare performance across all 5 branches
        </p>
      </div>

      {/* Chart */}
      <BranchChart data={branches} />

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch: any) => (
          <Card key={branch.branch} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{branch.branch}</CardTitle>
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Revenue</span>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(branch.revenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Orders</span>
                  </div>
                  <span className="font-semibold">
                    {formatNumber(branch.orders)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Avg Order Value</span>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(branch.averageOrderValue)}
                  </span>
                </div>
              </div>
              {branch.topItem && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Top Item</p>
                  <p className="text-sm font-medium truncate">{branch.topItem}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
