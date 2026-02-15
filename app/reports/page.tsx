'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, Clock, Plus, Eye, Share2 } from 'lucide-react';

const reports = [
  {
    id: 1,
    title: 'Q1 2026 Competitive Landscape Report',
    description: 'Comprehensive analysis of market position and competitor strategies',
    type: 'Executive',
    status: 'ready',
    generatedAt: 'Feb 15, 2026',
    pages: 24,
  },
  {
    id: 2,
    title: 'Weekly Intelligence Digest',
    description: 'Summary of key competitor activities and market changes',
    type: 'Weekly',
    status: 'ready',
    generatedAt: 'Feb 14, 2026',
    pages: 8,
  },
  {
    id: 3,
    title: 'Pricing Strategy Analysis',
    description: 'Deep dive into competitor pricing models and trends',
    type: 'Analysis',
    status: 'ready',
    generatedAt: 'Feb 12, 2026',
    pages: 15,
  },
  {
    id: 4,
    title: 'SWOT Comparison Report',
    description: 'Multi-competitor SWOT analysis with strategic recommendations',
    type: 'Strategic',
    status: 'generating',
    generatedAt: 'In progress',
    pages: 0,
  },
  {
    id: 5,
    title: 'Product Feature Comparison',
    description: 'Feature-by-feature comparison across top 5 competitors',
    type: 'Product',
    status: 'scheduled',
    generatedAt: 'Scheduled for Feb 16',
    pages: 0,
  },
];

const reportTemplates = [
  { name: 'Executive Summary', description: 'High-level overview for leadership' },
  { name: 'Weekly Digest', description: 'Regular competitive updates' },
  { name: 'Deep Dive Analysis', description: 'Detailed competitor research' },
  { name: 'Market Trends', description: 'Industry and market analysis' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ready':
      return <Badge className="bg-green-500">Ready</Badge>;
    case 'generating':
      return <Badge className="bg-yellow-500">Generating</Badge>;
    case 'scheduled':
      return <Badge variant="outline">Scheduled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Reports
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Generate and access competitive intelligence reports
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-slate-500">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-slate-500">Generated</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-slate-500">Generating</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-slate-500">Upcoming</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>Generated intelligence reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="p-2 bg-white dark:bg-slate-700 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {report.title}
                          </p>
                          {getStatusBadge(report.status)}
                        </div>
                        <p className="text-sm text-slate-500">{report.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <Badge variant="outline">{report.type}</Badge>
                          <span>{report.generatedAt}</span>
                          {report.pages > 0 && <span>{report.pages} pages</span>}
                        </div>
                      </div>
                      {report.status === 'ready' && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Report Templates</CardTitle>
                <CardDescription>Quick-start report generation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportTemplates.map((template, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-white">
                          {template.name}
                        </p>
                        <p className="text-xs text-slate-500">{template.description}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
