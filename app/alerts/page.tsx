'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Mail, MessageSquare, Smartphone, Settings, Check, X } from 'lucide-react';

const alerts = [
  {
    id: 1,
    title: 'Price Change Alert',
    message: 'Competitor A reduced Enterprise plan pricing by 20%',
    type: 'price',
    priority: 'high',
    timestamp: '10 minutes ago',
    read: false,
  },
  {
    id: 2,
    title: 'New Product Launch',
    message: 'Competitor B announced new AI-powered analytics feature',
    type: 'product',
    priority: 'medium',
    timestamp: '1 hour ago',
    read: false,
  },
  {
    id: 3,
    title: 'News Mention',
    message: 'Competitor C featured in TechCrunch for Series D funding',
    type: 'news',
    priority: 'low',
    timestamp: '3 hours ago',
    read: true,
  },
  {
    id: 4,
    title: 'Website Change Detected',
    message: 'Competitor D updated their homepage messaging',
    type: 'website',
    priority: 'low',
    timestamp: '5 hours ago',
    read: true,
  },
  {
    id: 5,
    title: 'Market Anomaly',
    message: 'Unusual traffic spike detected for Competitor A website',
    type: 'anomaly',
    priority: 'medium',
    timestamp: '1 day ago',
    read: true,
  },
];

const alertPreferences = [
  { name: 'Price Changes', description: 'When competitors change their pricing', enabled: true },
  { name: 'Product Updates', description: 'New features and product launches', enabled: true },
  { name: 'News & Press', description: 'Media mentions and press releases', enabled: true },
  { name: 'Website Changes', description: 'Significant website updates', enabled: false },
  { name: 'Anomalies', description: 'Unusual patterns detected by AI', enabled: true },
];

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high':
      return <Badge variant="destructive">{priority}</Badge>;
    case 'medium':
      return <Badge variant="default">{priority}</Badge>;
    default:
      return <Badge variant="secondary">{priority}</Badge>;
  }
};

export default function AlertsPage() {
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
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Alerts</CardTitle>
              <Bell className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-slate-500">Requires attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <Bell className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-slate-500">Urgent</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Bell className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-slate-500">Total alerts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
              <Settings className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-slate-500">Monitoring</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Latest notifications from your monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-start gap-4 p-4 rounded-lg ${
                        !alert.read
                          ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                          : 'bg-slate-50 dark:bg-slate-800'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        !alert.read ? 'bg-blue-100 dark:bg-blue-900' : 'bg-white dark:bg-slate-700'
                      }`}>
                        <Bell className={`h-4 w-4 ${!alert.read ? 'text-blue-600' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium ${
                            !alert.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
                          }`}>
                            {alert.title}
                          </p>
                          {getPriorityBadge(alert.priority)}
                        </div>
                        <p className="text-sm text-slate-500">{alert.message}</p>
                        <p className="text-xs text-slate-400">{alert.timestamp}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
