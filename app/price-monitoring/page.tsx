'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const priceData = [
  {
    competitor: 'Competitor A',
    product: 'Enterprise Plan',
    currentPrice: '$299/mo',
    previousPrice: '$249/mo',
    change: '+20%',
    trend: 'up',
    lastUpdated: '2 hours ago',
  },
  {
    competitor: 'Competitor B',
    product: 'Pro Suite',
    currentPrice: '$199/mo',
    previousPrice: '$199/mo',
    change: '0%',
    trend: 'stable',
    lastUpdated: '1 day ago',
  },
  {
    competitor: 'Competitor C',
    product: 'Business Tier',
    currentPrice: '$149/mo',
    previousPrice: '$179/mo',
    change: '-17%',
    trend: 'down',
    lastUpdated: '5 hours ago',
  },
  {
    competitor: 'Competitor D',
    product: 'Growth Plan',
    currentPrice: '$99/mo',
    previousPrice: '$89/mo',
    change: '+11%',
    trend: 'up',
    lastUpdated: '3 hours ago',
  },
];

export default function PriceMonitoringPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Price Monitoring
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track competitor pricing changes in real-time
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Price Increases</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-slate-500">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Price Decreases</CardTitle>
              <TrendingDown className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-slate-500">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Change</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+8.3%</div>
              <p className="text-xs text-slate-500">Industry average</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Price Changes</CardTitle>
            <CardDescription>Recent pricing updates from competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priceData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {item.competitor}
                    </p>
                    <p className="text-sm text-slate-500">{item.product}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{item.currentPrice}</span>
                      <Badge
                        variant={
                          item.trend === 'up'
                            ? 'destructive'
                            : item.trend === 'down'
                            ? 'default'
                            : 'secondary'
                        }
                        className="flex items-center gap-1"
                      >
                        {item.trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                        {item.trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
                        {item.change}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      was {item.previousPrice} • {item.lastUpdated}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
