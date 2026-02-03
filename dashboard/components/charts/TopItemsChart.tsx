'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TopItem } from '@/lib/types';

interface TopItemsChartProps {
  data: TopItem[];
  title?: string;
}

export function TopItemsChart({ data, title = 'Top 10 Items Sold' }: TopItemsChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    name: item.item.length > 20 ? item.item.substring(0, 20) + '...' : item.item
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={formattedData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number"
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <YAxis 
              type="category"
              dataKey="name" 
              tick={{ fontSize: 11 }}
              stroke="#888"
              width={150}
            />
            <Tooltip 
              formatter={(value: any, name: string) => {
                if (name === 'quantity') return [Number(value).toFixed(2), 'Quantity'];
                return [`$${Number(value).toFixed(2)}`, 'Revenue'];
              }}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <Legend />
            <Bar 
              dataKey="quantity" 
              fill="hsl(221.2 83.2% 53.3%)" 
              radius={[0, 8, 8, 0]}
              name="Quantity"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
