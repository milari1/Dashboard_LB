'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryMetrics } from '@/lib/types';

interface CategoryChartProps {
  data: CategoryMetrics[];
  title?: string;
}

const COLORS = [
  'hsl(221.2 83.2% 53.3%)',
  'hsl(210 40% 60%)',
  'hsl(200 70% 50%)',
  'hsl(190 80% 45%)',
  'hsl(180 75% 40%)',
  'hsl(170 70% 50%)',
  'hsl(160 65% 45%)',
  'hsl(150 60% 50%)',
  'hsl(140 55% 45%)',
  'hsl(130 50% 50%)',
];

export function CategoryChart({ data, title = 'Sales by Category' }: CategoryChartProps) {
  const chartData = data.map(item => ({
    name: item.category,
    value: item.revenue,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => `$${Number(value).toFixed(2)}`}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
