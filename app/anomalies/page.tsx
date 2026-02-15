'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Eye, X } from 'lucide-react';

const anomalies = [
  {
    id: 1,
    title: 'Unusual Price Drop - Competitor A',
    description: 'Competitor A dropped enterprise pricing by 40%, significantly below market average.',
    severity: 'critical',
    category: 'Pricing',
    detectedAt: '2 hours ago',
    status: 'new',
  },
  {
    id: 2,
    title: 'Spike in Negative Reviews',
    description: 'Competitor B received 150+ negative reviews in the last 24 hours, unusual pattern detected.',
    severity: 'high',
    category: 'Reputation',
    detectedAt: '5 hours ago',
    status: 'investigating',
  },
  {
    id: 3,
    title: 'Website Downtime Pattern',
    description: 'Competitor C website has been intermittently down for the past week.',
    severity: 'medium',
    category: 'Operations',
    detectedAt: '1 day ago',
    status: 'new',
  },
  {
    id: 4,
    title: 'Unusual Hiring Surge',
    description: 'Competitor D posted 50+ engineering positions in one week, suggesting major initiative.',
    severity: 'low',
    category: 'HR',
    detectedAt: '2 days ago',
    status: 'acknowledged',
  },
  {
    id: 5,
    title: 'Traffic Pattern Anomaly',
    description: 'Competitor A web traffic increased 300% following product announcement.',
    severity: 'medium',
    category: 'Marketing',
    detectedAt: '3 days ago',
    status: 'resolved',
  },
];

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    case 'high':
      return <AlertCircle className="h-5 w-5 text-orange-500" />;
    case 'medium':
      return <Info className="h-5 w-5 text-yellow-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <Badge variant="destructive">{severity}</Badge>;
    case 'high':
      return <Badge className="bg-orange-500">{severity}</Badge>;
    case 'medium':
      return <Badge className="bg-yellow-500">{severity}</Badge>;
    default:
      return <Badge variant="secondary">{severity}</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'new':
      return <Badge variant="outline" className="border-blue-500 text-blue-500">New</Badge>;
    case 'investigating':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Investigating</Badge>;
    case 'acknowledged':
      return <Badge variant="outline" className="border-purple-500 text-purple-500">Acknowledged</Badge>;
    case 'resolved':
      return <Badge variant="outline" className="border-green-500 text-green-500">Resolved</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AnomaliesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Anomalies
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            AI-detected unusual patterns and behaviors requiring attention
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">1</div>
              <p className="text-xs text-slate-500">Requires immediate action</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">1</div>
              <p className="text-xs text-slate-500">Needs attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medium</CardTitle>
              <Info className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">2</div>
              <p className="text-xs text-slate-500">Monitor closely</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">1</div>
              <p className="text-xs text-slate-500">This week</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detected Anomalies</CardTitle>
            <CardDescription>Unusual patterns flagged by AI monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    anomaly.severity === 'critical'
                      ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="p-2 bg-white dark:bg-slate-700 rounded-lg">
                    {getSeverityIcon(anomaly.severity)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {anomaly.title}
                      </p>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(anomaly.severity)}
                        {getStatusBadge(anomaly.status)}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500">{anomaly.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Badge variant="outline">{anomaly.category}</Badge>
                        <span>Detected {anomaly.detectedAt}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button variant="ghost" size="sm">
                          <X className="h-3 w-3 mr-1" />
                          Dismiss
                        </Button>
                      </div>
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
