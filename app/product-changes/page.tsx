'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Package, Sparkles, Wrench } from 'lucide-react';

const productChanges = [
  {
    competitor: 'Competitor A',
    type: 'New Feature',
    title: 'AI-Powered Analytics Dashboard',
    description: 'Launched advanced AI analytics with predictive insights and automated reporting.',
    date: 'Feb 14, 2026',
    impact: 'high',
  },
  {
    competitor: 'Competitor B',
    type: 'Update',
    title: 'Mobile App Redesign',
    description: 'Complete overhaul of mobile experience with improved UX and new navigation.',
    date: 'Feb 13, 2026',
    impact: 'medium',
  },
  {
    competitor: 'Competitor C',
    type: 'New Product',
    title: 'Enterprise Security Suite',
    description: 'New standalone security product targeting enterprise customers.',
    date: 'Feb 12, 2026',
    impact: 'high',
  },
  {
    competitor: 'Competitor D',
    type: 'Bug Fix',
    title: 'Performance Improvements',
    description: 'Major performance optimizations reducing load times by 40%.',
    date: 'Feb 11, 2026',
    impact: 'low',
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'New Feature':
      return <Sparkles className="h-4 w-4" />;
    case 'New Product':
      return <Package className="h-4 w-4" />;
    case 'Update':
      return <Activity className="h-4 w-4" />;
    default:
      return <Wrench className="h-4 w-4" />;
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    default:
      return 'secondary';
  }
};

export default function ProductChangesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Product Changes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Monitor competitor product updates and feature releases
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Features</CardTitle>
              <Sparkles className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-slate-500">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Products</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-slate-500">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Updates</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-slate-500">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Impact</CardTitle>
              <Activity className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-slate-500">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Changes</CardTitle>
            <CardDescription>Latest product updates from competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productChanges.map((change, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="p-2 bg-white dark:bg-slate-700 rounded-lg">
                    {getTypeIcon(change.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {change.title}
                      </p>
                      <Badge variant={getImpactColor(change.impact) as any}>
                        {change.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">{change.description}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{change.competitor}</span>
                      <span>•</span>
                      <span>{change.type}</span>
                      <span>•</span>
                      <span>{change.date}</span>
                    </div>
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
