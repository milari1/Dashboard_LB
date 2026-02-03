'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BranchMetrics } from '@/lib/types';

interface BranchChartProps {
  data: BranchMetrics[];
  title?: string;
}

export function BranchChart({ data, title = 'Revenue by Branch' }: BranchChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="branch" 
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#888"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <Legend />
            <Bar 
              dataKey="revenue" 
              fill="hsl(221.2 83.2% 53.3%)" 
              radius={[8, 8, 0, 0]}
              name="Revenue"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
