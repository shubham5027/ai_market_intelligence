'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  Eye, 
  X,
  Bot,
  Loader2,
  RefreshCw,
  MoreVertical,
  Filter,
  Activity,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
    case 'dismissed':
      return <Badge variant="outline" className="border-slate-400 text-slate-400">Dismissed</Badge>;
    default:
      return <Badge variant="outline">{status || 'new'}</Badge>;
  }
};

const getAnomalyTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    price_anomaly: 'Pricing',
    product_anomaly: 'Product',
    sentiment_anomaly: 'Sentiment',
    behavioral_anomaly: 'Behavioral',
  };
  return labels[type] || type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
};

export default function AnomaliesPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const buildUrl = () => {
    let url = '/api/anomalies?days=30';
    if (severityFilter !== 'all') url += `&severity=${severityFilter}`;
    if (statusFilter !== 'all') url += `&status=${statusFilter}`;
    return url;
  };

  const { data, error, mutate, isLoading } = useSWR(buildUrl(), fetcher, {
    refreshInterval: 30000,
  });

  const anomalies = data?.anomalies || [];
  const stats = data?.stats || {};

  // Run anomaly detection
  const runDetection = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-detection' }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`Detected ${result.metadata?.anomaliesDetected || 0} anomalies`);
        mutate();
      } else {
        toast.error(result.error || 'Detection failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to run detection');
    } finally {
      setIsRunning(false);
    }
  };

  // Update anomaly status
  const updateStatus = async (anomalyId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-status', anomalyId, status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`Status updated to ${newStatus}`);
        mutate();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  // Dismiss anomaly
  const dismissAnomaly = async (anomalyId: string) => {
    try {
      const res = await fetch('/api/anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss', anomalyId }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Anomaly dismissed');
        mutate();
      } else {
        toast.error(result.error || 'Failed to dismiss');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to dismiss');
    }
  };

  // View anomaly details
  const viewDetails = (anomaly: any) => {
    setSelectedAnomaly(anomaly);
    setDetailsOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Anomalies
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              AI-detected unusual patterns and behaviors requiring attention
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => mutate()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={runDetection} disabled={isRunning}>
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
              Run Detection
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.criticalCount || 0}</div>
              <p className="text-xs text-slate-500">Requires immediate action</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.highCount || 0}</div>
              <p className="text-xs text-slate-500">Needs attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.newCount || 0}</div>
              <p className="text-xs text-slate-500">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                stats.riskLevel === 'critical' ? 'text-red-600' :
                stats.riskLevel === 'high' ? 'text-orange-500' :
                stats.riskLevel === 'medium' ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {(stats.riskLevel || 'low').toUpperCase()}
              </div>
              <p className="text-xs text-slate-500">Overall risk assessment</p>
            </CardContent>
          </Card>
        </div>

        {/* Anomalies List */}
        <Card>
          <CardHeader>
            <CardTitle>Detected Anomalies</CardTitle>
            <CardDescription>Unusual patterns flagged by AI monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : anomalies.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No anomalies detected</p>
                <p className="text-sm text-slate-400 mt-1">Run detection to scan for unusual patterns</p>
              </div>
            ) : (
              <div className="space-y-4">
                {anomalies.map((anomaly: any) => (
                  <div
                    key={anomaly.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      anomaly.severity === 'critical'
                        ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                        : anomaly.severity === 'high'
                        ? 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg">
                      {getSeverityIcon(anomaly.severity)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {anomaly.title || anomaly.anomaly_type?.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(anomaly.severity)}
                          {getStatusBadge(anomaly.status)}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">
                        {anomaly.description || anomaly.details?.description || 'Anomaly detected requiring review'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Badge variant="outline">{getAnomalyTypeLabel(anomaly.anomaly_type)}</Badge>
                          {anomaly.competitor_name && (
                            <Badge variant="secondary">{anomaly.competitor_name}</Badge>
                          )}
                          <span>Detected {formatDistanceToNow(new Date(anomaly.detected_at), { addSuffix: true })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => viewDetails(anomaly)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => updateStatus(anomaly.id, 'investigating')}>
                                Mark as Investigating
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus(anomaly.id, 'acknowledged')}>
                                Mark as Acknowledged
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus(anomaly.id, 'resolved')}>
                                Mark as Resolved
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => dismissAnomaly(anomaly.id)} className="text-red-600">
                                <X className="h-3 w-3 mr-1" />
                                Dismiss
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anomaly Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedAnomaly && getSeverityIcon(selectedAnomaly.severity)}
                Anomaly Details
              </DialogTitle>
              <DialogDescription>
                Detailed information about this anomaly
              </DialogDescription>
            </DialogHeader>
            {selectedAnomaly && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-xs text-slate-500">Type</Label>
                    <p className="font-medium">{getAnomalyTypeLabel(selectedAnomaly.anomaly_type)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Severity</Label>
                    <div className="mt-1">{getSeverityBadge(selectedAnomaly.severity)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedAnomaly.status)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Detected</Label>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(selectedAnomaly.detected_at), { addSuffix: true })}
                    </p>
                  </div>
                  {selectedAnomaly.competitor_name && (
                    <div>
                      <Label className="text-xs text-slate-500">Competitor</Label>
                      <p className="font-medium">{selectedAnomaly.competitor_name}</p>
                    </div>
                  )}
                  {selectedAnomaly.confidence_score && (
                    <div>
                      <Label className="text-xs text-slate-500">Confidence</Label>
                      <p className="font-medium">{Math.round(selectedAnomaly.confidence_score * 100)}%</p>
                    </div>
                  )}
                </div>
                
                {selectedAnomaly.details && (
                  <div>
                    <Label className="text-xs text-slate-500">Details</Label>
                    <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      {selectedAnomaly.details.description && (
                        <p className="text-sm">{selectedAnomaly.details.description}</p>
                      )}
                      {selectedAnomaly.details.metrics && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-slate-500">Metrics</p>
                          <div className="grid gap-2 md:grid-cols-2">
                            {Object.entries(selectedAnomaly.details.metrics).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-slate-500">{key.replace(/_/g, ' ')}</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedAnomaly.details.possibleCauses && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-slate-500 mb-2">Possible Causes</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {selectedAnomaly.details.possibleCauses.map((cause: string, i: number) => (
                              <li key={i}>{cause}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedAnomaly.details.suggestedActions && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-slate-500 mb-2">Suggested Actions</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {selectedAnomaly.details.suggestedActions.map((action: string, i: number) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                    Close
                  </Button>
                  {selectedAnomaly.status !== 'resolved' && (
                    <Button onClick={() => {
                      updateStatus(selectedAnomaly.id, 'resolved');
                      setDetailsOpen(false);
                    }}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
