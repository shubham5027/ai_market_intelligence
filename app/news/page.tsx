'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  ExternalLink, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Building2, 
  RefreshCw,
  Loader2,
  Search,
  Plus,
  Bot,
  Sparkles,
  Brain,
  Target,
  Newspaper,
  ChevronDown,
  ChevronRight,
  Zap,
  Globe,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const getSentimentLabel = (score: number): string => {
  if (score > 0.3) return 'positive';
  if (score < -0.3) return 'negative';
  return 'neutral';
};

const getSentimentColor = (score: number) => {
  if (score > 0.3) return 'default';
  if (score < -0.3) return 'destructive';
  return 'secondary';
};

export default function NewsFeedPage() {
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchDialogOpen, setFetchDialogOpen] = useState(false);
  const [fetchQuery, setFetchQuery] = useState('');
  
  // AI Agent state
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [agentAction, setAgentAction] = useState<string>('search');
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentResult, setAgentResult] = useState<any>(null);
  const [agentQuery, setAgentQuery] = useState('');
  const [selectedArticleUrl, setSelectedArticleUrl] = useState('');
  const [researchTopic, setResearchTopic] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState('');

  // Build API URL with filters
  const apiUrl = `/api/news${sentimentFilter !== 'all' ? `?sentiment=${sentimentFilter}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    refreshInterval: 60000, // Refresh every minute
  });

  const { data: competitorsData } = useSWR('/api/competitors', fetcher);

  const articles = data?.articles || [];
  const stats = data?.stats || {
    totalArticles: 0,
    competitorMentions: 0,
    positivePercentage: 0,
    last24Hours: 0,
    thisWeek: 0,
  };

  // Filter articles by search query
  const filteredArticles = articles.filter((article: any) =>
    article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.source?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch news from external sources
  const handleFetchNews = async (competitorId?: string) => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/news/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitor_id: competitorId,
          query: fetchQuery || undefined,
          max_results: 10,
          days_back: 7,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch news');
      }

      toast.success(`Fetched ${result.stats.saved} new articles`);
      setFetchDialogOpen(false);
      setFetchQuery('');
      mutate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsFetching(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  // AI Agent execution
  const runAgentAction = async (action: string, params: Record<string, any>) => {
    setAgentLoading(true);
    setAgentResult(null);
    try {
      const response = await fetch('/api/news/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Agent action failed');
      }
      
      setAgentResult(result);
      toast.success(`Agent completed: ${action}`);
      
      // Refresh news list if articles were saved
      if (action === 'news-intelligence' || action === 'competitor-intelligence') {
        mutate();
      }
    } catch (error: any) {
      toast.error(error.message);
      setAgentResult({ error: error.message });
    } finally {
      setAgentLoading(false);
    }
  };

  const handleAgentSearch = () => {
    if (!agentQuery) return;
    runAgentAction('search', { query: agentQuery, topic: 'news', maxResults: 10 });
  };

  const handleResearch = () => {
    if (!researchTopic) return;
    runAgentAction('research', { topic: researchTopic, maxSources: 15 });
  };

  const handleNewsIntelligence = () => {
    runAgentAction('news-intelligence', {
      query: agentQuery || undefined,
      competitor: selectedCompetitor || undefined,
      daysBack: 7,
      saveToDb: true,
    });
  };

  const handleCompetitorIntelligence = () => {
    if (!selectedCompetitor) return;
    const competitor = competitorsData?.competitors?.find((c: any) => c.id === selectedCompetitor);
    runAgentAction('competitor-intelligence', {
      competitorName: competitor?.name,
      competitorWebsite: competitor?.website,
      saveToDb: true,
    });
  };

  const handleAnalyzeArticle = (url?: string) => {
    const targetUrl = url || selectedArticleUrl;
    if (!targetUrl) return;
    runAgentAction('analyze-article', { url: targetUrl });
  };

  const handleSummarizeNews = () => {
    runAgentAction('summarize-news', {
      query: agentQuery || undefined,
      competitor: selectedCompetitor ? 
        competitorsData?.competitors?.find((c: any) => c.id === selectedCompetitor)?.name : 
        undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              News Feed
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Stay updated with the latest industry and competitor news
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => mutate()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant={agentPanelOpen ? "default" : "outline"}
              onClick={() => setAgentPanelOpen(!agentPanelOpen)}
              className={agentPanelOpen ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              <Bot className="h-4 w-4 mr-2" />
              AI Agent
              <Sparkles className="h-3 w-3 ml-1" />
            </Button>
            <Dialog open={fetchDialogOpen} onOpenChange={setFetchDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Fetch News
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Fetch News</DialogTitle>
                  <DialogDescription>
                    Search for news articles from external sources
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Search Query (optional)</Label>
                    <Input
                      placeholder="Enter search keywords..."
                      value={fetchQuery}
                      onChange={(e) => setFetchQuery(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Or Select Competitor</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {competitorsData?.competitors?.map((comp: any) => (
                        <Button
                          key={comp.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleFetchNews(comp.id)}
                          disabled={isFetching}
                        >
                          {isFetching ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {comp.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handleFetchNews()}
                    disabled={isFetching || !fetchQuery}
                  >
                    {isFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Search News
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisWeek || 0}</div>
              <p className="text-xs text-slate-500">This week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Competitor Mentions</CardTitle>
              <Building2 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.competitorMentions || 0}</div>
              <p className="text-xs text-slate-500">Unique competitors</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.positivePercentage || 0}%</div>
              <p className="text-xs text-slate-500">Of all articles</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Breaking News</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.last24Hours || 0}</div>
              <p className="text-xs text-slate-500">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Agent Panel */}
        {agentPanelOpen && (
          <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      AI News Intelligence Agent
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Powered by Tavily
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Use AI agents to research, analyze, and summarize news
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setAgentPanelOpen(false)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="search" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-4">
                  <TabsTrigger value="search" className="flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Search
                  </TabsTrigger>
                  <TabsTrigger value="research" className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    Research
                  </TabsTrigger>
                  <TabsTrigger value="intelligence" className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Intelligence
                  </TabsTrigger>
                  <TabsTrigger value="analyze" className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Analyze
                  </TabsTrigger>
                  <TabsTrigger value="summarize" className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    Summarize
                  </TabsTrigger>
                </TabsList>

                {/* Search Tab */}
                <TabsContent value="search" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Search Query</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search for news topics, companies, events..."
                        value={agentQuery}
                        onChange={(e) => setAgentQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAgentSearch()}
                      />
                      <Button onClick={handleAgentSearch} disabled={agentLoading || !agentQuery}>
                        {agentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      AI-powered web search to find the latest news and information
                    </p>
                  </div>
                </TabsContent>

                {/* Research Tab */}
                <TabsContent value="research" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Research Topic</Label>
                    <Textarea
                      placeholder="Enter a topic for deep research (e.g., 'Tesla's autonomous driving technology developments')"
                      value={researchTopic}
                      onChange={(e) => setResearchTopic(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleResearch} disabled={agentLoading || !researchTopic} className="w-full">
                    {agentLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Researching...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Start Deep Research
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500">
                    Conducts comprehensive research using multiple sources and synthesizes findings
                  </p>
                </TabsContent>

                {/* Intelligence Tab */}
                <TabsContent value="intelligence" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Select Competitor</Label>
                      <Select value={selectedCompetitor} onValueChange={setSelectedCompetitor}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a competitor" />
                        </SelectTrigger>
                        <SelectContent>
                          {competitorsData?.competitors?.map((comp: any) => (
                            <SelectItem key={comp.id} value={comp.id}>
                              {comp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Or Enter Query</Label>
                      <Input
                        placeholder="Industry, topic, or keyword..."
                        value={agentQuery}
                        onChange={(e) => setAgentQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleNewsIntelligence} 
                      disabled={agentLoading || (!selectedCompetitor && !agentQuery)}
                      className="flex-1"
                    >
                      {agentLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Newspaper className="h-4 w-4 mr-2" />}
                      News Intelligence
                    </Button>
                    <Button 
                      onClick={handleCompetitorIntelligence}
                      disabled={agentLoading || !selectedCompetitor}
                      variant="outline"
                      className="flex-1"
                    >
                      {agentLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Target className="h-4 w-4 mr-2" />}
                      Full Competitor Analysis
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Get comprehensive intelligence including news, trends, and market analysis
                  </p>
                </TabsContent>

                {/* Analyze Tab */}
                <TabsContent value="analyze" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Article URL to Analyze</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/article..."
                        value={selectedArticleUrl}
                        onChange={(e) => setSelectedArticleUrl(e.target.value)}
                      />
                      <Button onClick={() => handleAnalyzeArticle()} disabled={agentLoading || !selectedArticleUrl}>
                        {agentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      AI extracts content, analyzes sentiment, identifies entities, and provides insights
                    </p>
                  </div>
                </TabsContent>

                {/* Summarize Tab */}
                <TabsContent value="summarize" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Summarize News About</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Select value={selectedCompetitor} onValueChange={setSelectedCompetitor}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select competitor" />
                        </SelectTrigger>
                        <SelectContent>
                          {competitorsData?.competitors?.map((comp: any) => (
                            <SelectItem key={comp.id} value={comp.id}>
                              {comp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Or enter topic..."
                        value={agentQuery}
                        onChange={(e) => setAgentQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSummarizeNews} disabled={agentLoading || (!selectedCompetitor && !agentQuery)} className="w-full">
                    {agentLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating Summary...
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Generate News Briefing
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500">
                    Creates an executive briefing from multiple news sources
                  </p>
                </TabsContent>
              </Tabs>

              {/* Agent Results */}
              {(agentResult || agentLoading) && (
                <div className="mt-4 pt-4 border-t">
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
                      <ChevronDown className="h-4 w-4" />
                      Agent Results
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      {agentLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
                            <p className="text-sm text-slate-500 mt-2">AI Agent is working...</p>
                          </div>
                        </div>
                      ) : agentResult?.error ? (
                        <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Error</span>
                          </div>
                          <p className="text-sm text-red-600 mt-1">{agentResult.error}</p>
                        </div>
                      ) : agentResult?.data ? (
                        <ScrollArea className="h-80">
                          <div className="space-y-4 pr-4">
                            {/* Render different result types */}
                            {agentResult.action === 'search' && agentResult.data.answer && (
                              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">AI Answer:</p>
                                <p className="text-sm">{agentResult.data.answer}</p>
                              </div>
                            )}
                            
                            {agentResult.action === 'research' && (
                              <div className="space-y-3">
                                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Research Summary:</p>
                                  <p className="text-sm">{agentResult.data.summary}</p>
                                </div>
                                {agentResult.data.keyFindings?.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-2">Key Findings:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                      {agentResult.data.keyFindings.map((finding: string, i: number) => (
                                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400">{finding}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {agentResult.action === 'news-intelligence' && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant={
                                    agentResult.data.sentiment === 'positive' ? 'default' :
                                    agentResult.data.sentiment === 'negative' ? 'destructive' : 'secondary'
                                  }>
                                    {agentResult.data.sentiment} sentiment
                                  </Badge>
                                  <span className="text-sm text-slate-500">
                                    {agentResult.data.articles?.length || 0} articles found
                                  </span>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                  <p className="text-sm">{agentResult.data.summary}</p>
                                </div>
                                {agentResult.data.trends?.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-2">Trending Topics:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {agentResult.data.trends.map((trend: string, i: number) => (
                                        <Badge key={i} variant="outline" className="text-xs">{trend}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {agentResult.action === 'analyze-article' && agentResult.data.analysis && (
                              <div className="space-y-3">
                                {agentResult.data.analysis.summary && (
                                  <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Summary:</p>
                                    <p className="text-sm">{agentResult.data.analysis.summary}</p>
                                  </div>
                                )}
                                {agentResult.data.analysis.sentiment && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Sentiment:</span>
                                    <Badge variant={
                                      agentResult.data.analysis.sentiment.label === 'positive' ? 'default' :
                                      agentResult.data.analysis.sentiment.label === 'negative' ? 'destructive' : 'secondary'
                                    }>
                                      {agentResult.data.analysis.sentiment.label} ({agentResult.data.analysis.sentiment.score?.toFixed(2)})
                                    </Badge>
                                  </div>
                                )}
                                {agentResult.data.analysis.keyPoints?.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-2">Key Points:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                      {agentResult.data.analysis.keyPoints.map((point: string, i: number) => (
                                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400">{point}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {agentResult.action === 'summarize-news' && (
                              <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                                  News Briefing ({agentResult.data.articleCount} articles):
                                </p>
                                <p className="text-sm whitespace-pre-wrap">{agentResult.data.summary}</p>
                              </div>
                            )}

                            {/* Search results list */}
                            {agentResult.data.results?.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Sources ({agentResult.data.results.length}):</p>
                                <div className="space-y-2">
                                  {agentResult.data.results.slice(0, 5).map((result: any, i: number) => (
                                    <a
                                      key={i}
                                      href={result.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block p-2 bg-white dark:bg-slate-800 rounded border hover:border-purple-300 transition-colors"
                                    >
                                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">{result.title}</p>
                                      <p className="text-xs text-slate-500 truncate">{result.content?.substring(0, 100)}...</p>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      ) : null}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Latest News</CardTitle>
                <CardDescription>Recent articles and press releases</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search articles..."
                    className="pl-8 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sentiment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sentiment</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Failed to load news articles
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No news articles found</p>
                <p className="text-sm mt-1">Click "Fetch News" to get latest articles</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredArticles.map((article: any) => (
                  <div
                    key={article.id}
                    className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${
                      (article.sentiment_score || 0) > 0.3 
                        ? 'bg-green-100 dark:bg-green-900' 
                        : (article.sentiment_score || 0) < -0.3
                        ? 'bg-red-100 dark:bg-red-900'
                        : 'bg-white dark:bg-slate-600'
                    }`}>
                      {(article.sentiment_score || 0) > 0.3 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (article.sentiment_score || 0) < -0.3 ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {article.title}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {article.summary || article.content?.substring(0, 150) + '...'}
                          </p>
                        </div>
                        {article.url && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={article.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getSentimentColor(article.sentiment_score || 0) as any}>
                          {getSentimentLabel(article.sentiment_score || 0)}
                        </Badge>
                        {article.competitors?.name && (
                          <Badge variant="outline">
                            <Building2 className="h-3 w-3 mr-1" />
                            {article.competitors.name}
                          </Badge>
                        )}
                        <span className="text-xs text-slate-400">
                          {article.source} • {formatDate(article.collected_at || article.published_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
