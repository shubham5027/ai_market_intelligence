'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Activity, 
  Package, 
  Sparkles, 
  Wrench, 
  Plus, 
  Loader2, 
  RefreshCw, 
  Search, 
  Bot,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const getTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'new_feature':
    case 'feature':
      return <Sparkles className="h-4 w-4 text-purple-500" />;
    case 'new_product':
    case 'product_launch':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'update':
    case 'enhancement':
      return <Activity className="h-4 w-4 text-green-500" />;
    case 'bug_fix':
    case 'fix':
      return <Wrench className="h-4 w-4 text-orange-500" />;
    default:
      return <Activity className="h-4 w-4 text-slate-500" />;
  }
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    new_feature: 'New Feature',
    feature: 'Feature',
    new_product: 'New Product',
    product_launch: 'Product Launch',
    update: 'Update',
    enhancement: 'Enhancement',
    bug_fix: 'Bug Fix',
    fix: 'Fix',
  };
  return labels[type?.toLowerCase()] || type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Change';
};

const getImpactBadge = (change: any) => {
  const impact = change.after_state?.impact || change.metadata?.impact || 'medium';
  switch (impact) {
    case 'critical':
      return <Badge variant="destructive">Critical Impact</Badge>;
    case 'high':
      return <Badge variant="destructive">High Impact</Badge>;
    case 'medium':
      return <Badge variant="default">Medium Impact</Badge>;
    case 'low':
    default:
      return <Badge variant="secondary">Low Impact</Badge>;
  }
};

export default function ProductChangesPage() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [formData, setFormData] = useState({
    competitor_id: '',
    change_type: 'new_feature',
    product_name: '',
    description: '',
    impact: 'medium',
  });

  // Fetch product changes
  const { data, error, isLoading, mutate } = useSWR('/api/product-changes?days=30', fetcher, {
    refreshInterval: 60000,
  });

  // Fetch competitors for dropdown
  const { data: competitorsData } = useSWR('/api/competitors', fetcher);
  const competitors = competitorsData?.competitors || [];

  const changes = data?.changes || [];
  const stats = data?.stats || {};

  // Filter changes
  const filteredChanges = changes.filter((c: any) => {
    const matchesSearch = !searchQuery || 
      c.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.competitors?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || 
      c.change_type === typeFilter ||
      (typeFilter === 'feature' && (c.change_type === 'new_feature' || c.change_type === 'feature')) ||
      (typeFilter === 'product' && (c.change_type === 'new_product' || c.change_type === 'product_launch'));
    
    return matchesSearch && matchesType;
  });

  // Add new product change
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/product-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          ...formData,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to add product change');
      }

      toast.success('Product change added successfully');
      setOpen(false);
      setFormData({ competitor_id: '', change_type: 'new_feature', product_name: '', description: '', impact: 'medium' });
      mutate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Run product change detection agent
  const runDetection = async () => {
    setScanning(true);
    try {
      toast.info('Running product change detection...');
      
      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents: ['product_change'] }),
      });

      if (!response.ok) throw new Error('Detection failed');
      
      toast.success('Product change detection complete');
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to run detection');
    } finally {
      setScanning(false);
    }
  };

  // Delete a product change
  const deleteChange = async (changeId: string) => {
    try {
      const response = await fetch('/api/product-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', changeId }),
      });

      if (!response.ok) throw new Error('Delete failed');

      toast.success('Product change deleted');
      mutate();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Product Changes
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Monitor competitor product updates and feature releases
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => mutate()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={runDetection} disabled={scanning}>
              {scanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
              Detect Changes
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Change
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Product Change</DialogTitle>
                  <DialogDescription>
                    Manually record a competitor product update
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Competitor</Label>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Change Type</Label>
                      <Select 
                        value={formData.change_type} 
                        onValueChange={(v) => setFormData({ ...formData, change_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new_feature">New Feature</SelectItem>
                          <SelectItem value="new_product">New Product</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                          <SelectItem value="enhancement">Enhancement</SelectItem>
                          <SelectItem value="bug_fix">Bug Fix</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Impact</Label>
                      <Select 
                        value={formData.impact} 
                        onValueChange={(v) => setFormData({ ...formData, impact: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Product Name</Label>
                    <Input
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      placeholder="e.g., AI Analytics Dashboard"
                      required
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the product change..."
                      rows={3}
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
                        'Add Change'
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
              <CardTitle className="text-sm font-medium">New Features</CardTitle>
              <Sparkles className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newFeatures || 0}</div>
              <p className="text-xs text-slate-500">This period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Products</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newProducts || 0}</div>
              <p className="text-xs text-slate-500">This period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Updates</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.updates || 0}</div>
              <p className="text-xs text-slate-500">This period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Impact</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.highImpact || 0}</div>
              <p className="text-xs text-slate-500">Requires attention</p>
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="feature">Features</SelectItem>
              <SelectItem value="product">Products</SelectItem>
              <SelectItem value="update">Updates</SelectItem>
              <SelectItem value="bug_fix">Bug Fixes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Changes List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Changes</CardTitle>
            <CardDescription>Latest product updates from competitors</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : filteredChanges.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No product changes found</p>
                <p className="text-sm text-slate-400 mt-1">
                  {searchQuery || typeFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Add changes manually or run the detection agent'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredChanges.map((change: any) => (
                  <div
                    key={change.id}
                    className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg">
                      {getTypeIcon(change.change_type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {change.product_name}
                        </p>
                        {getImpactBadge(change)}
                      </div>
                      {change.description && (
                        <p className="text-sm text-slate-500">{change.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{change.competitors?.name || 'Unknown Competitor'}</span>
                        <span>•</span>
                        <span>{getTypeLabel(change.change_type)}</span>
                        <span>•</span>
                        <span>
                          {change.detected_at 
                            ? formatDistanceToNow(new Date(change.detected_at), { addSuffix: true })
                            : 'Recently'}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => deleteChange(change.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
