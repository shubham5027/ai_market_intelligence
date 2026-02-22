'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  Plus, 
  Eye, 
  Share2, 
  Loader2, 
  RefreshCw,
  Trash2,
  TrendingUp,
  Bot,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState('executive');

  // Fetch reports
  const { data, error, isLoading, mutate } = useSWR('/api/reports', fetcher, {
    refreshInterval: 30000,
  });

  // Fetch competitors for SWOT/pricing reports
  const { data: competitorsData } = useSWR('/api/competitors', fetcher);
  const competitors = competitorsData?.competitors || [];

  const reports = data?.reports || [];
  const stats = data?.stats || { total: 0, thisMonth: 0, generating: 0, scheduled: 0 };
  const templates = data?.templates || [];

  // Generate a report
  const generateReport = async (type: string) => {
    setGenerating(true);
    toast.info(`Generating ${type} report...`);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          type,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate report');
      }

      toast.success('Report generated successfully!');
      setGenerateOpen(false);
      mutate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGenerating(false);
    }
  };

  // Delete a report
  const deleteReport = async (reportId: string) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', reportId }),
      });

      if (!response.ok) throw new Error('Delete failed');

      toast.success('Report deleted');
      mutate();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // View report details
  const viewReport = (report: any) => {
    setSelectedReport(report);
    setViewOpen(true);
  };

  // Download report as JSON
  const downloadReport = (report: any) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title || 'report'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Reports
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Generate and access competitive intelligence reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => mutate()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate New Report</DialogTitle>
                  <DialogDescription>
                    Select a report type to generate using AI analysis
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Report Type</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="executive">Executive Summary</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                        <SelectItem value="swot">SWOT Analysis</SelectItem>
                        <SelectItem value="market">Market Trends</SelectItem>
                        <SelectItem value="pricing">Pricing Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setGenerateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => generateReport(selectedType)} disabled={generating}>
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Bot className="h-4 w-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-slate-500">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <p className="text-xs text-slate-500">Generated</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.generating}</div>
              <p className="text-xs text-slate-500">Generating</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ready}</div>
              <p className="text-xs text-slate-500">Available</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Reports List */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>Generated intelligence reports</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No reports generated yet</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Click "Generate Report" to create your first report
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report: any) => (
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
                          <p className="text-sm text-slate-500 line-clamp-2">
                            {report.summary?.substring(0, 150) || 'No description'}
                            {report.summary?.length > 150 ? '...' : ''}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <Badge variant="outline">{report.type}</Badge>
                            <span>
                              {report.generated_at
                                ? formatDistanceToNow(new Date(report.generated_at), { addSuffix: true })
                                : 'Recently'}
                            </span>
                            {report.pages > 0 && <span>{report.pages} pages</span>}
                            {report.confidence_score && (
                              <span className="text-green-600">
                                {Math.round(report.confidence_score * 100)}% confidence
                              </span>
                            )}
                          </div>
                        </div>
                        {report.status === 'ready' && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => viewReport(report)}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => downloadReport(report)}>
                              <Download className="h-3 w-3 mr-1" />
                              Export
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => deleteReport(report.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Templates */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Report Templates</CardTitle>
                <CardDescription>Quick-start report generation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates.map((template: any) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedType(template.id);
                        setGenerateOpen(true);
                      }}
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

            {/* Recent Activity */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedType('executive');
                    setGenerateOpen(true);
                  }}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Executive Summary
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedType('weekly');
                    setGenerateOpen(true);
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Generate Weekly Digest
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* View Report Sheet */}
        <Sheet open={viewOpen} onOpenChange={setViewOpen}>
          <SheetContent className="w-[600px] sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedReport?.title}</SheetTitle>
              <SheetDescription>
                Generated {selectedReport?.generated_at 
                  ? formatDistanceToNow(new Date(selectedReport.generated_at), { addSuffix: true })
                  : 'recently'}
              </SheetDescription>
            </SheetHeader>
            {selectedReport && (
              <div className="space-y-6 mt-6">
                {/* Summary */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Summary</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                    {selectedReport.summary || 'No summary available'}
                  </p>
                </div>

                {/* Key Insights */}
                {selectedReport.key_insights && selectedReport.key_insights.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Key Insights</h3>
                    <ul className="space-y-2">
                      {selectedReport.key_insights.map((insight: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{typeof insight === 'string' ? insight : JSON.stringify(insight)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Recommendations</h3>
                    <ul className="space-y-2">
                      {selectedReport.recommendations.map((rec: any, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{typeof rec === 'string' ? rec : rec.recommendation || JSON.stringify(rec)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metrics */}
                {selectedReport.metrics && Object.keys(selectedReport.metrics).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Metrics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(selectedReport.metrics).map(([key, value]) => (
                        <div key={key} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <p className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => downloadReport(selectedReport)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                  <Button variant="outline" onClick={() => setViewOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
