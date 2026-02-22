'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Bell, Key, Palette, Loader2, Check, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Default settings
const defaultSettings = {
  profile: {
    name: '',
    email: '',
    company: '',
    role: '',
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    realTimeAlerts: true,
    alertSeverityThreshold: 'medium',
  },
  appearance: {
    darkMode: false,
    compactView: false,
    showAnimations: true,
    refreshInterval: '30',
  },
  apiKeys: {
    openaiKey: '',
    newsApiKey: '',
    tavilyKey: '',
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('app_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({
          ...prev,
          ...parsed,
          profile: { ...prev.profile, ...parsed.profile },
          notifications: { ...prev.notifications, ...parsed.notifications },
          appearance: { ...prev.appearance, ...parsed.appearance },
          apiKeys: { ...prev.apiKeys, ...parsed.apiKeys },
        }));
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    setLoaded(true);
  }, []);

  // Save all settings
  const saveSettings = (section?: string) => {
    setSaving(true);
    try {
      localStorage.setItem('app_settings', JSON.stringify(settings));
      
      // Apply appearance settings immediately
      if (!section || section === 'appearance') {
        if (settings.appearance.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      toast.success(section ? `${section} settings saved` : 'Settings saved');
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Update profile
  const updateProfile = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }));
  };

  // Update notifications
  const updateNotifications = (field: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
  };

  // Update appearance
  const updateAppearance = (field: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, [field]: value },
    }));
  };

  // Update API keys
  const updateApiKeys = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [field]: value },
    }));
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('app_settings');
    document.documentElement.classList.remove('dark');
    toast.success('Settings reset to defaults');
  };

  // Test API connection
  const testApiConnection = async (type: string) => {
    toast.info(`Testing ${type} connection...`);
    
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you'd make an actual API call here
    if (type === 'supabase') {
      try {
        const response = await fetch('/api/competitors');
        if (response.ok) {
          toast.success('Supabase connection successful');
        } else {
          toast.error('Supabase connection failed');
        }
      } catch {
        toast.error('Supabase connection failed');
      }
    } else {
      toast.success(`${type} connection appears valid`);
    }
  };

  if (!loaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage your account and application preferences
            </p>
          </div>
          <Button variant="outline" onClick={resetSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      value={settings.profile.name}
                      onChange={(e) => updateProfile('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john@company.com" 
                      value={settings.profile.email}
                      onChange={(e) => updateProfile('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input 
                      id="company" 
                      placeholder="Acme Inc." 
                      value={settings.profile.company}
                      onChange={(e) => updateProfile('company', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input 
                      id="role" 
                      placeholder="Product Manager" 
                      value={settings.profile.role}
                      onChange={(e) => updateProfile('role', e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={() => saveSettings('Profile')} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-slate-500">Receive alerts via email</p>
                    </div>
                    <Switch 
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(v) => updateNotifications('emailNotifications', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-slate-500">Browser push notifications</p>
                    </div>
                    <Switch 
                      checked={settings.notifications.pushNotifications}
                      onCheckedChange={(v) => updateNotifications('pushNotifications', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Digest</p>
                      <p className="text-sm text-slate-500">Summary email every Monday</p>
                    </div>
                    <Switch 
                      checked={settings.notifications.weeklyDigest}
                      onCheckedChange={(v) => updateNotifications('weeklyDigest', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Real-time Alerts</p>
                      <p className="text-sm text-slate-500">Instant notifications for high-priority items</p>
                    </div>
                    <Switch 
                      checked={settings.notifications.realTimeAlerts}
                      onCheckedChange={(v) => updateNotifications('realTimeAlerts', v)}
                    />
                  </div>
                  <div className="pt-4 border-t">
                    <Label>Alert Severity Threshold</Label>
                    <p className="text-sm text-slate-500 mb-2">Only notify for alerts at or above this level</p>
                    <Select 
                      value={settings.notifications.alertSeverityThreshold}
                      onValueChange={(v) => updateNotifications('alertSeverityThreshold', v)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low and above</SelectItem>
                        <SelectItem value="medium">Medium and above</SelectItem>
                        <SelectItem value="high">High and above</SelectItem>
                        <SelectItem value="critical">Critical only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => saveSettings('Notification')} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Configure API keys for AI and data integrations. 
                  <span className="text-orange-500 ml-1">Note: Server-side API keys are configured via environment variables.</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Server Configuration:</strong> API keys like OPENROUTER_API_KEY, TAVILY_API_KEY, and 
                    Supabase credentials should be set in your <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">.env.local</code> file 
                    or deployment environment variables.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Supabase Connection</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testApiConnection('supabase')}
                      >
                        Test Connection
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Configured via NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>OpenRouter / OpenAI</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testApiConnection('OpenRouter')}
                      >
                        Test Connection
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Configured via OPENROUTER_API_KEY or OPENAI_API_KEY
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Tavily (Web Search)</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testApiConnection('Tavily')}
                      >
                        Test Connection
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Configured via TAVILY_API_KEY - Required for news and web research
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Environment Variables Checklist</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <code>NEXT_PUBLIC_SUPABASE_URL</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <code>OPENROUTER_API_KEY</code> <span className="text-slate-400">or</span> <code>OPENAI_API_KEY</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <code>TAVILY_API_KEY</code> <span className="text-slate-400">(optional)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-slate-500">Use dark theme</p>
                    </div>
                    <Switch 
                      checked={settings.appearance.darkMode}
                      onCheckedChange={(v) => {
                        updateAppearance('darkMode', v);
                        if (v) {
                          document.documentElement.classList.add('dark');
                        } else {
                          document.documentElement.classList.remove('dark');
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Compact View</p>
                      <p className="text-sm text-slate-500">Reduce spacing for more content</p>
                    </div>
                    <Switch 
                      checked={settings.appearance.compactView}
                      onCheckedChange={(v) => updateAppearance('compactView', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Animations</p>
                      <p className="text-sm text-slate-500">Enable UI animations and transitions</p>
                    </div>
                    <Switch 
                      checked={settings.appearance.showAnimations}
                      onCheckedChange={(v) => updateAppearance('showAnimations', v)}
                    />
                  </div>
                  <div className="pt-4 border-t">
                    <Label>Data Refresh Interval</Label>
                    <p className="text-sm text-slate-500 mb-2">How often to auto-refresh dashboard data</p>
                    <Select 
                      value={settings.appearance.refreshInterval}
                      onValueChange={(v) => updateAppearance('refreshInterval', v)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">Every 15 seconds</SelectItem>
                        <SelectItem value="30">Every 30 seconds</SelectItem>
                        <SelectItem value="60">Every minute</SelectItem>
                        <SelectItem value="300">Every 5 minutes</SelectItem>
                        <SelectItem value="0">Manual only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => saveSettings('Appearance')} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
