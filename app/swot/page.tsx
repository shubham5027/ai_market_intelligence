'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Shield, Target, AlertTriangle, Lightbulb } from 'lucide-react';

const swotData = {
  strengths: [
    { title: 'Strong Brand Recognition', impact: 'high', description: 'Market leader with 35% brand awareness' },
    { title: 'Advanced Technology Stack', impact: 'high', description: 'Proprietary AI capabilities' },
    { title: 'Large Customer Base', impact: 'medium', description: '50,000+ active enterprise customers' },
    { title: 'Strong Financial Position', impact: 'medium', description: 'Cash reserves of $200M' },
  ],
  weaknesses: [
    { title: 'Limited Mobile Presence', impact: 'high', description: 'Mobile app rated 3.2 stars' },
    { title: 'Complex Pricing Model', impact: 'medium', description: 'Customer confusion reported' },
    { title: 'Slow Support Response', impact: 'medium', description: 'Average 48hr response time' },
  ],
  opportunities: [
    { title: 'Emerging Markets Expansion', impact: 'high', description: 'APAC region growing 25% YoY' },
    { title: 'AI Integration Demand', impact: 'high', description: '78% customers want AI features' },
    { title: 'Partnership Opportunities', impact: 'medium', description: 'Potential integration partners identified' },
  ],
  threats: [
    { title: 'New Market Entrants', impact: 'high', description: '3 well-funded startups entering market' },
    { title: 'Regulatory Changes', impact: 'medium', description: 'GDPR-like regulations expanding' },
    { title: 'Economic Downturn', impact: 'medium', description: 'Budget cuts affecting enterprise sales' },
  ],
};

const getImpactBadge = (impact: string) => {
  switch (impact) {
    case 'high':
      return <Badge variant="destructive">{impact}</Badge>;
    case 'medium':
      return <Badge variant="default">{impact}</Badge>;
    default:
      return <Badge variant="secondary">{impact}</Badge>;
  }
};

export default function SwotAnalysisPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            SWOT Analysis
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Strategic analysis of competitive strengths, weaknesses, opportunities, and threats
          </p>
        </div>

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
                {swotData.strengths.map((item, index) => (
                  <div key={index} className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                      {getImpactBadge(item.impact)}
                    </div>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                ))}
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
                {swotData.weaknesses.map((item, index) => (
                  <div key={index} className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                      {getImpactBadge(item.impact)}
                    </div>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                ))}
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
                {swotData.opportunities.map((item, index) => (
                  <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                      {getImpactBadge(item.impact)}
                    </div>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                ))}
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
                {swotData.threats.map((item, index) => (
                  <div key={index} className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                      {getImpactBadge(item.impact)}
                    </div>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
