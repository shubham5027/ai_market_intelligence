'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Loader2, 
  RefreshCw,
  Search,
  Bot,
  AlertTriangle,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PriceMonitoringPage() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trendFilter, setTrendFilter] = useState<string>('all');
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [formData, setFormData] = useState({
    competitor_id: '',
    product_name: '',
    price: '',
    currency: 'USD',
    url: '',
  });

  // Fetch price data
  const { data, error, isLoading, mutate } = useSWR('/api/prices?limit=50', fetcher, {
    refreshInterval: 60000,
  });

  // Fetch competitors for dropdown
  const { data: competitorsData } = useSWR('/api/competitors', fetcher);
  const competitors = competitorsData?.competitors || [];

  const prices = data?.prices || [];
  const stats = data?.stats || {};

  // Filter prices
  const filteredPrices = prices.filter((p: any) => {
    const matchesSearch = !searchQuery || 
      p.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.competitors?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const change = p.change_percentage || 0;
    const matchesTrend = trendFilter === 'all' || 
      (trendFilter === 'up' && change > 0) ||
      (trendFilter === 'down' && change < 0) ||
      (trendFilter === 'stable' && change === 0);
    
    return matchesSearch && matchesTrend;
  });

  // Add new price record
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to add price');
      }

      toast.success('Price record added successfully');
      setOpen(false);
      setFormData({ competitor_id: '', product_name: '', price: '', currency: 'USD', url: '' });
      mutate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Run price monitoring agent
  const runPriceMonitoring = async () => {
    setScanning(true);
    try {
      toast.info('Running price monitoring agent...');
      
      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents: ['price_monitoring'] }),
      });

      if (!response.ok) throw new Error('Price monitoring failed');
      
      const result = await response.json();
      toast.success(`Price monitoring complete.`);
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to run price monitoring');
    } finally {
      setScanning(false);
    }
  };

  // Get trend icon and styling
  const getTrendDisplay = (change: number) => {
    if (change > 0) {
      return {
        icon: <ArrowUpRight className="h-3 w-3" />,
        variant: 'destructive' as const,
        label: `+${change.toFixed(1)}%`,
      };
    } else if (change < 0) {
      return {
        icon: <ArrowDownRight className="h-3 w-3" />,
        variant: 'default' as const,
        label: `${change.toFixed(1)}%`,
      };
    }
    return {
      icon: <Minus className="h-3 w-3" />,
      variant: 'secondary' as const,
      label: '0%',
    };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Price Monitoring
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Track competitor pricing changes in real-time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => mutate()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={runPriceMonitoring} disabled={scanning}>
              {scanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
              Run Scan
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Price
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Price Record</DialogTitle>
                  <DialogDescription>
                    Manually add a competitor price point
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="competitor">Competitor</Label>
                    <Select 
                      value={formData.competitor_id} 
                      onValueChange={(v) => setFormData({ ...formData, competitor_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select competitor" />
                      </SelectTrigger>
                      <SelectContent>
                        {competitors.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="product_name">Product Name</Label>
                    <Input
                      id="product_name"
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      placeholder="e.g., Enterprise Plan"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="299.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        value={formData.currency} 
                        onValueChange={(v) => setFormData({ ...formData, currency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="INR">INR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="url">Source URL (optional)</Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://competitor.com/pricing"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting || !formData.competitor_id}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add Price'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Price Increases</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.priceIncreases || 0}</div>
              <p className="text-xs text-slate-500">Detected this period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Price Decreases</CardTitle>
              <TrendingDown className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.priceDecreases || 0}</div>
              <p className="text-xs text-slate-500">Detected this period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Change</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                (stats.avgChangePercentage || 0) > 0 ? 'text-red-600' : 
                (stats.avgChangePercentage || 0) < 0 ? 'text-green-600' : ''
              }`}>
                {(stats.avgChangePercentage || 0) > 0 ? '+' : ''}{stats.avgChangePercentage || 0}%
              </div>
              <p className="text-xs text-slate-500">Industry average</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Significant Changes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.significantChanges || 0}</div>
              <p className="text-xs text-slate-500">≥10% change</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search products or competitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={trendFilter} onValueChange={setTrendFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Trend" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trends</SelectItem>
              <SelectItem value="up">Increases</SelectItem>
              <SelectItem value="down">Decreases</SelectItem>
              <SelectItem value="stable">Stable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Changes List */}
        <Card>
          <CardHeader>
            <CardTitle>Price Changes</CardTitle>
            <CardDescription>Recent pricing updates from competitors</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : filteredPrices.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No price records found</p>
                <p className="text-sm text-slate-400 mt-1">
                  {searchQuery || trendFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Add price records or run the monitoring agent'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPrices.map((item: any) => {
                  const trend = getTrendDisplay(item.change_percentage || 0);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {item.competitors?.name || 'Unknown Competitor'}
                        </p>
                        <p className="text-sm text-slate-500">{item.product_name}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">
                            {item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : item.currency === 'GBP' ? '£' : '₹'}
                            {item.price?.toFixed(2)}
                          </span>
                          <Badge variant={trend.variant} className="flex items-center gap-1">
                            {trend.icon}
                            {trend.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {item.detected_at ? formatDistanceToNow(new Date(item.detected_at), { addSuffix: true }) : 'Recently'}
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
