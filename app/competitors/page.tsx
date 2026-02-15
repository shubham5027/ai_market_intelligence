'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2, TrendingUp, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CompetitorsPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/competitors', fetcher);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add competitor');

      toast.success('Competitor added successfully');
      setOpen(false);
      setFormData({ name: '', industry: '', website: '', description: '' });
      mutate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const runScan = async (competitorId: string) => {
    try {
      toast.info('Starting competitor scan...');

      const response = await fetch('/api/agents/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitorId }),
      });

      if (!response.ok) throw new Error('Scan failed');

      toast.success('Scan completed successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Competitors
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage and monitor your competitive landscape
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Competitor</DialogTitle>
                <DialogDescription>
                  Enter the details of the competitor you want to monitor
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Competitor'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-red-600">Failed to load competitors</p>
            </CardContent>
          </Card>
        ) : data?.competitors?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No competitors yet
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Add your first competitor to start monitoring
              </p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.competitors?.map((competitor: any) => (
              <Card key={competitor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{competitor.name}</CardTitle>
                      <CardDescription>{competitor.industry}</CardDescription>
                    </div>
                    <Badge variant={competitor.status === 'active' ? 'default' : 'secondary'}>
                      {competitor.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {competitor.website && (
                    <p className="text-sm text-blue-600 mb-3 truncate">
                      {competitor.website}
                    </p>
                  )}
                  {competitor.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                      {competitor.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runScan(competitor.id)}
                      className="flex-1"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Run Scan
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
