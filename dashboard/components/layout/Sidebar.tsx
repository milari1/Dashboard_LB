'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, TrendingUp, Table, FileText, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Overview', href: '/', icon: Home },
  { name: 'Branches', href: '/branches', icon: Building2 },
  { name: 'Sales Analytics', href: '/sales', icon: TrendingUp },
  { name: 'Data Table', href: '/data', icon: Table },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white border-r min-h-screen">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <ChefHat className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Catering</h1>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t text-xs text-muted-foreground">
        <p>© 2026 Catering Co.</p>
        <p>5 Branches</p>
      </div>
    </div>
  );
}
