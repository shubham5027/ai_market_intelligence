'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bell, 
  BellOff, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Settings, 
  Check, 
  X, 
  Loader2, 
  RefreshCw,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const alertPreferences = [
  { name: 'Price Changes', description: 'When competitors change their pricing', enabled: true },
  { name: 'Product Updates', description: 'New features and product launches', enabled: true },
  { name: 'News & Press', description: 'Media mentions and press releases', enabled: true },
  { name: 'Website Changes', description: 'Significant website updates', enabled: false },
  { name: 'Anomalies', description: 'Unusual patterns detected by AI', enabled: true },
];

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <Badge variant="destructive">Critical</Badge>;
    case 'warning':
      return <Badge className="bg-orange-500">Warning</Badge>;
    case 'info':
    default:
      return <Badge variant="secondary">Info</Badge>;
  }
};

const getAlertTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    price: 'Price Change',
    product: 'Product Update',
    news: 'News',
    website: 'Website Change',
    anomaly: 'Anomaly',
    market_shift: 'Market Shift',
    competitor: 'Competitor',
  };
  return labels[type] || type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Alert';
};

const getAlertIcon = (type: string, isRead: boolean) => {
  const colorClass = isRead ? 'text-slate-400' : 'text-blue-600';
  switch (type) {
    case 'anomaly':
      return <AlertTriangle className={`h-4 w-4 ${isRead ? 'text-slate-400' : 'text-orange-500'}`} />;
    case 'critical':
      return <AlertTriangle className={`h-4 w-4 ${isRead ? 'text-slate-400' : 'text-red-500'}`} />;
    default:
      return <Bell className={`h-4 w-4 ${colorClass}`} />;
  }
};

export default function AlertsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const buildUrl = () => {
    let url = '/api/alerts?limit=50';
    if (showUnreadOnly) url += '&unread=true';
    if (typeFilter !== 'all') url += `&type=${typeFilter}`;
    return url;
  };

  const { data, error, mutate, isLoading } = useSWR(buildUrl(), fetcher, {
    refreshInterval: 30000,
  });

  const alerts = data?.alerts || [];
  const stats = data?.stats || {};

  // Mark single alert as read
  const markAsRead = async (alertId: string) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', alertId }),
      });
      const result = await res.json();
      if (result.success) {
        mutate();
      } else {
        toast.error(result.error || 'Failed to mark as read');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark as read');
    }
  };

  // Delete alert
  const deleteAlert = async (alertId: string) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', alertId }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Alert deleted');
        mutate();
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-all-read' }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('All alerts marked as read');
        mutate();
      } else {
        toast.error(result.error || 'Failed to mark all as read');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark all as read');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Alerts
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Configure and manage your competitive intelligence alerts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="news">News</SelectItem>
                <SelectItem value="anomaly">Anomaly</SelectItem>
                <SelectItem value="website">Website</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => mutate()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={markAllAsRead} disabled={stats.unreadCount === 0}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Alerts</CardTitle>
              <Bell className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadCount || 0}</div>
              <p className="text-xs text-slate-500">Requires attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highPriorityCount || 0}</div>
              <p className="text-xs text-slate-500">Urgent</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Bell className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisWeekCount || 0}</div>
              <p className="text-xs text-slate-500">Total alerts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alert Types</CardTitle>
              <Settings className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRulesCount || 0}</div>
              <p className="text-xs text-slate-500">Monitoring</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Alerts</CardTitle>
                  <CardDescription>Latest notifications from your monitoring</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Unread only</span>
                  <Switch checked={showUnreadOnly} onCheckedChange={setShowUnreadOnly} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-12">
                    <BellOff className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No alerts found</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {showUnreadOnly ? 'All alerts have been read' : 'Alerts will appear here when detected'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert: any) => (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-4 p-4 rounded-lg ${
                          !alert.is_read
                            ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          !alert.is_read ? 'bg-blue-100 dark:bg-blue-900' : 'bg-white dark:bg-slate-700'
                        }`}>
                          {getAlertIcon(alert.alert_type, alert.is_read)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium ${
                              !alert.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
                            }`}>
                              {alert.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{getAlertTypeLabel(alert.alert_type)}</Badge>
                              {getSeverityBadge(alert.severity)}
                            </div>
                          </div>
                          <p className="text-sm text-slate-500">{alert.message}</p>
                          <p className="text-xs text-slate-400">
                            {alert.created_at ? formatDistanceToNow(new Date(alert.created_at), { addSuffix: true }) : 'Recently'}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {!alert.is_read && (
                            <Button variant="ghost" size="icon" onClick={() => markAsRead(alert.id)} title="Mark as read">
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => deleteAlert(alert.id)} title="Delete" className="text-red-500 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Preferences</CardTitle>
                <CardDescription>Choose which alerts to receive</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alertPreferences.map((pref, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{pref.name}</p>
                        <p className="text-xs text-slate-500">{pref.description}</p>
                      </div>
                      <Switch defaultChecked={pref.enabled} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>How you receive alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="text-sm">Email</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                      <span className="text-sm">Slack</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-slate-500" />
                      <span className="text-sm">Mobile Push</span>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
