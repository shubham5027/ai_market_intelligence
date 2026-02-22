'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  RefreshCw, 
  Loader2, 
  Bot, 
  Search,
  Sparkles,
  Brain,
  Plus,
  AlertCircle,
  Activity,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MarketShiftsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [researchTopic, setResearchTopic] = useState('');
  const [researchResult, setResearchResult] = useState<any>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [industry, setIndustry] = useState('SaaS');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [manualShift, setManualShift] = useState({
    type: 'market_trend',
    description: '',
    severity: 'medium',
    impact: 'medium',
  });

  const { data, error, mutate, isLoading } = useSWR('/api/market-shifts?days=90', fetcher, {
    refreshInterval: 60000,
  });

  const shifts = data?.shifts || [];
  const stats = data?.stats || {};

  // Run the MarketShiftAgent to detect shifts from existing data
  const runDetection = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/market-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-agent', industry }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`Detected ${result.metadata?.shiftsDetected || 0} market shifts`);
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

  // Scan for market trends using Tavily
  const scanMarketTrends = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/market-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan', industry }),
      });
      const result = await res.json();
      if (result.success) {
        setScanResult(result.data);
        toast.success(`Found ${result.data.totalResults} market insights`);
      } else {
        toast.error(result.error || 'Scan failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to scan market');
    } finally {
      setIsScanning(false);
    }
  };

  // Deep research on a specific topic
  const runResearch = async () => {
    if (!researchTopic) return;
    setIsResearching(true);
    setResearchResult(null);
    try {
      const res = await fetch('/api/market-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'research', topic: researchTopic }),
      });
      const result = await res.json();
      if (result.success) {
        setResearchResult(result.data);
        toast.success('Research complete');
      } else {
        toast.error(result.error || 'Research failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to research');
    } finally {
      setIsResearching(false);
    }
  };

  // Add manual market shift
  const addManualShift = async () => {
    if (!manualShift.description) {
      toast.error('Description is required');
      return;
    }
    try {
      const res = await fetch('/api/market-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-manual', manualShift }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Market shift added');
        setAddDialogOpen(false);
        setManualShift({ type: 'market_trend', description: '', severity: 'medium', impact: 'medium' });
        mutate();
      } else {
        toast.error(result.error || 'Failed to add');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add shift');
    }
  };

  const getDirectionFromType = (type: string) => {
    if (type?.includes('growth') || type?.includes('increase')) return 'up';
    if (type?.includes('decline') || type?.includes('decrease')) return 'down';
    return 'neutral';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Market Shifts
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Track significant market changes and emerging trends
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SaaS">SaaS</SelectItem>
                <SelectItem value="AI">AI/ML</SelectItem>
                <SelectItem value="Fintech">Fintech</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="E-commerce">E-commerce</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={scanMarketTrends} disabled={isScanning}>
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Scan Trends
            </Button>
            <Button onClick={runDetection} disabled={isRunning}>
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
              Run Detection
            </Button>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manual
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Market Shift</DialogTitle>
                  <DialogDescription>Manually add a market shift observation</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={manualShift.type} onValueChange={(v) => setManualShift(p => ({ ...p, type: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market_trend">Market Trend</SelectItem>
                        <SelectItem value="pricing_trend">Pricing Trend</SelectItem>
                        <SelectItem value="technology_shift">Technology Shift</SelectItem>
                        <SelectItem value="competitive_move">Competitive Move</SelectItem>
                        <SelectItem value="regulatory_change">Regulatory Change</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={manualShift.description}
                      onChange={(e) => setManualShift(p => ({ ...p, description: e.target.value }))}
                      placeholder="Describe the market shift..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select value={manualShift.severity} onValueChange={(v) => setManualShift(p => ({ ...p, severity: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Impact</Label>
                      <Select value={manualShift.impact} onValueChange={(v) => setManualShift(p => ({ ...p, impact: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={addManualShift} className="w-full">Add Shift</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
              <Activity className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalShifts || 0}</div>
              <p className={`text-xs ${stats.trend === 'increasing' ? 'text-green-500' : stats.trend === 'decreasing' ? 'text-red-500' : 'text-slate-500'}`}>
                {stats.changePercent ? `${stats.changePercent}%` : '0%'} from last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.criticalCount || 0}</div>
              <p className="text-xs text-slate-500">Require immediate attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Impact</CardTitle>
              <Target className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.highCount || 0}</div>
              <p className="text-xs text-slate-500">High-severity shifts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confidence</CardTitle>
              <Sparkles className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(parseFloat(stats.averageConfidence || '0') * 100).toFixed(0)}%</div>
              <p className="text-xs text-slate-500">Avg detection confidence</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Research Panel */}
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Market Research
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                <Sparkles className="h-3 w-3 mr-1" />
                Tavily Powered
              </Badge>
            </CardTitle>
            <CardDescription>Deep research on market trends and competitive dynamics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter research topic (e.g., 'AI market consolidation trends')"
                  value={researchTopic}
                  onChange={(e) => setResearchTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runResearch()}
                  className="flex-1"
                />
                <Button onClick={runResearch} disabled={isResearching || !researchTopic}>
                  {isResearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                  Research
                </Button>
              </div>

              {/* Scan Results */}
              {scanResult && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Market Scan Results ({scanResult.totalResults} insights)
                  </p>
                  {scanResult.answers?.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {scanResult.answers.map((answer: string, i: number) => (
                        <p key={i} className="text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded">{answer}</p>
                      ))}
                    </div>
                  )}
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {scanResult.results?.slice(0, 8).map((result: any, i: number) => (
                        <a
                          key={i}
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 bg-slate-50 dark:bg-slate-800 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{result.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-2">{result.content}</p>
                        </a>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Research Results */}
              {researchResult && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    Deep Research Results
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded">
                      <p className="text-sm">{researchResult.summary}</p>
                    </div>
                    {researchResult.keyFindings?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Key Findings:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {researchResult.keyFindings.map((finding: string, i: number) => (
                            <li key={i} className="text-sm text-slate-600 dark:text-slate-400">{finding}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Market Shifts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Market Shifts</CardTitle>
                <CardDescription>Significant changes affecting the competitive landscape</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => mutate()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Activity className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No market shifts detected yet</p>
                <p className="text-sm">Click "Run Detection" or "Scan Trends" to analyze the market</p>
              </div>
            ) : (
              <div className="space-y-4">
                {shifts.map((shift: any, index: number) => {
                  const direction = getDirectionFromType(shift.shift_type);
                  return (
                    <div
                      key={shift.id || index}
                      className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className={`p-2 rounded-lg ${
                        direction === 'up' 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : direction === 'down'
                          ? 'bg-red-100 dark:bg-red-900'
                          : 'bg-slate-100 dark:bg-slate-700'
                      }`}>
                        {direction === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : direction === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : (
                          <ArrowRight className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {shift.shift_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(shift.severity) as any}>
                              {shift.severity}
                            </Badge>
                            {shift.confidence_score && (
                              <Badge variant="outline">
                                {(shift.confidence_score * 100).toFixed(0)}% confidence
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-500">{shift.description}</p>
                        <p className="text-xs text-slate-400">
                          {shift.detected_at ? formatDistanceToNow(new Date(shift.detected_at), { addSuffix: true }) : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
