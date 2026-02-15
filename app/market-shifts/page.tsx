'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowRight, Globe, Users, Zap } from 'lucide-react';

const marketShifts = [
  {
    title: 'AI Adoption Accelerating',
    description: 'Enterprise AI adoption increased by 45% in the last quarter, creating new competitive dynamics.',
    direction: 'up',
    impact: 'high',
    category: 'Technology',
    date: 'Feb 2026',
  },
  {
    title: 'Remote Work Market Expansion',
    description: 'Remote-first tools market grew to $52B, opening new customer segments.',
    direction: 'up',
    impact: 'high',
    category: 'Market Size',
    date: 'Feb 2026',
  },
  {
    title: 'Customer Acquisition Costs Rising',
    description: 'Industry-wide CAC increased by 23%, affecting profitability metrics.',
    direction: 'down',
    impact: 'medium',
    category: 'Economics',
    date: 'Jan 2026',
  },
  {
    title: 'Market Consolidation Trend',
    description: '5 major M&A deals in the last month indicate industry consolidation.',
    direction: 'neutral',
    impact: 'high',
    category: 'Competitive',
    date: 'Jan 2026',
  },
  {
    title: 'Emerging Markets Growth',
    description: 'APAC and LATAM regions showing 35% higher growth than mature markets.',
    direction: 'up',
    impact: 'medium',
    category: 'Geographic',
    date: 'Jan 2026',
  },
];

const marketStats = [
  { label: 'Total Market Size', value: '$85B', change: '+12%', trend: 'up' },
  { label: 'Market Growth Rate', value: '18%', change: '+3%', trend: 'up' },
  { label: 'New Entrants', value: '23', change: '+8', trend: 'up' },
  { label: 'Market Exits', value: '7', change: '-2', trend: 'down' },
];

export default function MarketShiftsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Market Shifts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track significant market changes and emerging trends
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {marketStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change} from last quarter
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Market Shifts</CardTitle>
            <CardDescription>Significant changes affecting the competitive landscape</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketShifts.map((shift, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className={`p-2 rounded-lg ${
                    shift.direction === 'up' 
                      ? 'bg-green-100 dark:bg-green-900' 
                      : shift.direction === 'down'
                      ? 'bg-red-100 dark:bg-red-900'
                      : 'bg-slate-100 dark:bg-slate-700'
                  }`}>
                    {shift.direction === 'up' ? (
                      <TrendingUp className={`h-4 w-4 ${
                        shift.direction === 'up' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    ) : shift.direction === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {shift.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant={shift.impact === 'high' ? 'destructive' : 'default'}>
                          {shift.impact} impact
                        </Badge>
                        <Badge variant="outline">{shift.category}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500">{shift.description}</p>
                    <p className="text-xs text-slate-400">{shift.date}</p>
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
