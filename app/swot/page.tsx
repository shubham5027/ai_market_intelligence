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
  Shield, 
  Target, 
  AlertTriangle, 
  Lightbulb, 
  Loader2, 
  RefreshCw, 
  Bot,
  History,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const getImpactBadge = (impact: string | number) => {
  // Handle both string impact ('high', 'medium', 'low') and numeric impact_score
  let level = 'low';
  if (typeof impact === 'number') {
    if (impact >= 70) level = 'high';
    else if (impact >= 40) level = 'medium';
    else level = 'low';
  } else {
    level = impact?.toLowerCase() || 'low';
  }

  switch (level) {
    case 'high':
      return <Badge variant="destructive">High</Badge>;
    case 'medium':
      return <Badge variant="default">Medium</Badge>;
    default:
      return <Badge variant="secondary">Low</Badge>;
  }
};

// Default empty SWOT data
const emptySwotData = {
  strengths: [],
  weaknesses: [],
  opportunities: [],
  threats: [],
};

export default function SwotAnalysisPage() {
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');
  const [companyContext, setCompanyContext] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);

  // Fetch competitors
  const { data: competitorsData } = useSWR('/api/competitors', fetcher);
  const competitors = competitorsData?.competitors || [];

  // Fetch historical SWOT analyses
  const { data: swotData, error, mutate } = useSWR('/api/swot?limit=20', fetcher, {
    refreshInterval: 60000,
  });

  const analyses = swotData?.analyses || [];

  // Get current display data (either selected historical or most recent)
  const displayData = currentAnalysis || analyses[0] || null;

  // Transform analysis data to display format
  const getSwotItems = (items: any[] = []) => {
    return items.map((item: any) => ({
      title: item.insight || item.title || 'Untitled',
      description: item.evidence || item.description || '',
      impact: item.impact_score || item.impact || 50,
    }));
  };

  // Run SWOT analysis
  const runAnalysis = async () => {
    if (!selectedCompetitor) {
      toast.error('Please select a competitor');
      return;
    }

    setAnalyzing(true);
    toast.info('Running SWOT analysis...');

    try {
      const response = await fetch('/api/swot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitorId: selectedCompetitor,
          companyContext: companyContext || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const result = await response.json();
      toast.success('SWOT analysis complete!');
      setDialogOpen(false);
      setCurrentAnalysis(result.data);
      mutate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // View historical analysis
  const viewAnalysis = (analysis: any) => {
    setCurrentAnalysis(analysis);
    setHistoryOpen(false);
  };

  // Get competitor name by ID
  const getCompetitorName = (analysis: any) => {
    return analysis?.competitors?.name || 
           competitors.find((c: any) => c.id === analysis?.competitor_id)?.name || 
           'Unknown Competitor';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              SWOT Analysis
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Strategic analysis of competitive strengths, weaknesses, opportunities, and threats
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setHistoryOpen(true)}>
              <History className="h-4 w-4 mr-2" />
              History ({analyses.length})
            </Button>
            <Button variant="outline" onClick={() => mutate()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Bot className="h-4 w-4 mr-2" />
                  Run Analysis
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Run SWOT Analysis</DialogTitle>
                  <DialogDescription>
                    Select a competitor to analyze their strategic position
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Competitor</Label>
                    <Select value={selectedCompetitor} onValueChange={setSelectedCompetitor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select competitor" />
                      </SelectTrigger>
                      <SelectContent>
                        {competitors.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Company Context (Optional)</Label>
                    <Textarea
                      value={companyContext}
                      onChange={(e) => setCompanyContext(e.target.value)}
                      placeholder="Provide context about your company for comparison..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={runAnalysis} disabled={analyzing || !selectedCompetitor}>
                      {analyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Bot className="h-4 w-4 mr-2" />
                          Run Analysis
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Current Analysis Info */}
        {displayData && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium">{getCompetitorName(displayData)}</p>
                    <p className="text-sm text-slate-500">
                      Analyzed {displayData.analyzed_at 
                        ? formatDistanceToNow(new Date(displayData.analyzed_at), { addSuffix: true })
                        : 'recently'}
                    </p>
                  </div>
                </div>
                {displayData.overall_assessment && (
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Overall Assessment</p>
                    <p className="font-medium">{displayData.overall_assessment}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Data State */}
        {!displayData && (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No SWOT analyses yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Click "Run Analysis" to analyze a competitor
              </p>
            </CardContent>
          </Card>
        )}

        {/* SWOT Grid */}
        {displayData && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Strengths */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-green-700 dark:text-green-400">Strengths</CardTitle>
                    <CardDescription>Internal positive factors</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getSwotItems(displayData.strengths).length > 0 ? (
                    getSwotItems(displayData.strengths).map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                          {getImpactBadge(item.impact)}
                        </div>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">No strengths identified</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-red-700 dark:text-red-400">Weaknesses</CardTitle>
                    <CardDescription>Internal negative factors</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getSwotItems(displayData.weaknesses).length > 0 ? (
                    getSwotItems(displayData.weaknesses).map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                          {getImpactBadge(item.impact)}
                        </div>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">No weaknesses identified</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-blue-700 dark:text-blue-400">Opportunities</CardTitle>
                    <CardDescription>External positive factors</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getSwotItems(displayData.opportunities).length > 0 ? (
                    getSwotItems(displayData.opportunities).map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                          {getImpactBadge(item.impact)}
                        </div>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">No opportunities identified</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Threats */}
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-700 dark:text-orange-400">Threats</CardTitle>
                    <CardDescription>External negative factors</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getSwotItems(displayData.threats).length > 0 ? (
                    getSwotItems(displayData.threats).map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                          {getImpactBadge(item.impact)}
                        </div>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">No threats identified</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Strategic Recommendations */}
        {displayData?.strategic_recommendations && displayData.strategic_recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Strategic Recommendations</CardTitle>
              <CardDescription>AI-generated strategic advice based on the analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayData.strategic_recommendations.map((rec: any, index: number) => (
                  <div key={index} className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border-l-4 border-purple-500">
                    <p className="font-medium text-slate-900 dark:text-white">{rec.recommendation || rec}</p>
                    {rec.rationale && (
                      <p className="text-sm text-slate-500 mt-1">{rec.rationale}</p>
                    )}
                    {rec.priority && (
                      <Badge variant="outline" className="mt-2">{rec.priority} priority</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Sheet */}
        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetContent className="w-[400px] sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Analysis History</SheetTitle>
              <SheetDescription>
                Previous SWOT analyses
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-3 mt-6">
              {analyses.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No analyses yet</p>
              ) : (
                analyses.map((analysis: any) => (
                  <div
                    key={analysis.id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      currentAnalysis?.id === analysis.id
                        ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200'
                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => viewAnalysis(analysis)}
                  >
                    <p className="font-medium">{getCompetitorName(analysis)}</p>
                    <p className="text-sm text-slate-500">
                      {analysis.analyzed_at 
                        ? formatDistanceToNow(new Date(analysis.analyzed_at), { addSuffix: true })
                        : 'Recently'}
                    </p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className="text-green-600">{(analysis.strengths || []).length} S</span>
                      <span className="text-red-600">{(analysis.weaknesses || []).length} W</span>
                      <span className="text-blue-600">{(analysis.opportunities || []).length} O</span>
                      <span className="text-orange-600">{(analysis.threats || []).length} T</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
