'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Package,
  Newspaper,
  AlertTriangle,
  Activity,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DashboardOverview() {
  const { data: overviewData, error, isLoading } = useSWR('/api/dashboard/overview', fetcher, {
    refreshInterval: 30000,
  });

  const overview = overviewData?.overview;

  const statCards = [
    {
      title: 'Active Competitors',
      value: overview?.competitors?.active || 0,
      change: '+0',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Price Changes (7d)',
      value: overview?.pricing?.totalChanges || 0,
      change: overview?.pricing?.averageChange
        ? `${overview.pricing.averageChange > 0 ? '+' : ''}${overview.pricing.averageChange.toFixed(1)}%`
        : '0%',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: overview?.pricing?.averageChange > 0 ? 'up' : 'down',
    },
    {
      title: 'Product Updates',
      value: overview?.products?.totalChanges || 0,
      change: `${overview?.products?.newProducts || 0} new`,
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'News Articles',
      value: overview?.news?.totalArticles || 0,
      change: overview?.news?.sentimentTrend || 'neutral',
      icon: Newspaper,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Active Alerts',
      value: overview?.alerts?.unread || 0,
      change: `${overview?.alerts?.critical || 0} critical`,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Anomalies Detected',
      value: overview?.anomalies?.total || 0,
      change: `${overview?.anomalies?.highSeverity || 0} high severity`,
      icon: Activity,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load dashboard data. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Intelligence Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Real-time competitive intelligence and market analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Run Analysis
          </Button>
          <Button>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      {stat.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                      {stat.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Sentiment Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Market Sentiment Analysis</CardTitle>
            <CardDescription>News sentiment trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <Badge variant="outline">
                {overview?.news?.sentimentTrend === 'positive' && 'Positive Trend'}
                {overview?.news?.sentimentTrend === 'negative' && 'Negative Trend'}
                {overview?.news?.sentimentTrend === 'neutral' && 'Neutral Trend'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Price Changes Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Price Change Distribution</CardTitle>
            <CardDescription>Pricing activity across competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-slate-900 dark:text-white">
                  {overview?.pricing?.significantChanges || 0}
                </p>
                <p className="text-sm text-slate-500">Significant Changes ({'>'}10%)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-blue-600">
                  {overview?.pricing?.averageChange?.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-500">Average Change</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Executive Report */}
      {overview?.latestReport && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Latest Executive Report</CardTitle>
                <CardDescription>
                  Generated {new Date(overview.latestReport.generated_at).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge>
                Confidence: {(overview.latestReport.confidence_score * 100).toFixed(0)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
              {overview.latestReport.summary}
            </p>
            <Button variant="link" className="mt-2 p-0">
              View Full Report →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Market Shifts & Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Shifts</CardTitle>
            <CardDescription>Detected market movements (7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview?.marketShifts?.total > 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    {overview.marketShifts.total} market shifts detected
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {overview.marketShifts.critical} critical
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No market shifts detected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anomaly Detection</CardTitle>
            <CardDescription>Unusual patterns identified</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview?.anomalies?.total > 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    {overview.anomalies.total} anomalies detected
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {overview.anomalies.highSeverity} high severity
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No anomalies detected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
