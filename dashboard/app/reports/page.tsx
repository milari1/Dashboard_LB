import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Calendar, Building2, TrendingUp, DollarSign } from 'lucide-react';

export default function ReportsPage() {
  const reports = [
    {
      title: 'Monthly Financial Summary',
      description: 'Complete revenue and expense breakdown by month',
      icon: DollarSign,
      comingSoon: true,
    },
    {
      title: 'Branch Performance Report',
      description: 'Comparative analysis of all branch locations',
      icon: Building2,
      comingSoon: true,
    },
    {
      title: 'Sales Trend Analysis',
      description: 'Historical trends and forecasting',
      icon: TrendingUp,
      comingSoon: true,
    },
    {
      title: 'Custom Date Range Report',
      description: 'Generate reports for specific time periods',
      icon: Calendar,
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reports</h1>
        <p className="text-muted-foreground">
          Generate and download comprehensive business reports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Card key={report.title} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2">
                    <report.icon className="h-5 w-5 text-primary" />
                    {report.title}
                  </CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {report.comingSoon ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    Coming Soon
                  </span>
                </div>
              ) : (
                <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Generate Report
                </button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Report Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>• Reports are generated based on your current database data</p>
            <p>• Financial reports include all confirmed transactions</p>
            <p>• You can filter reports by date range and branch</p>
            <p>• Exported reports are available in PDF and Excel formats</p>
            <p>• Reports are cached for 5 minutes to optimize performance</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
