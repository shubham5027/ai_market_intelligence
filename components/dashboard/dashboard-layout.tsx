'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Bell,
  FileText,
  Users,
  Settings,
  Activity,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Overview', href: '/', icon: BarChart3 },
  { name: 'Competitors', href: '/competitors', icon: Users },
  { name: 'Price Monitoring', href: '/price-monitoring', icon: TrendingUp },
  { name: 'Product Changes', href: '/product-changes', icon: Activity },
  { name: 'News Feed', href: '/news', icon: FileText },
  { name: 'SWOT Analysis', href: '/swot', icon: BarChart3 },
  { name: 'Market Shifts', href: '/market-shifts', icon: TrendingUp },
  { name: 'Anomalies', href: '/anomalies', icon: AlertTriangle },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                CompetitiveAI
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 p-6 border-b border-slate-200 dark:border-slate-800">
            <Activity className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                CompetitiveAI
              </h2>
              <p className="text-xs text-slate-500">Intelligence Platform</p>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 lg:mx-auto">
          <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1" />
            <ThemeToggle />
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
