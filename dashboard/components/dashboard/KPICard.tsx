import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  description?: string;
}

export function KPICard({ title, value, change, icon: Icon, description }: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;
  const hasChange = change !== undefined && !isNaN(change);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hasChange && (
          <p className={cn(
            "text-xs mt-1",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? "↑" : "↓"} {Math.abs(change).toFixed(1)}% from last month
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
