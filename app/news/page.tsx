'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Clock, TrendingUp, Building2 } from 'lucide-react';

const newsItems = [
  {
    title: 'Competitor A Announces $500M Series D Funding',
    source: 'TechCrunch',
    summary: 'Major funding round signals aggressive expansion plans into enterprise market.',
    category: 'Funding',
    sentiment: 'positive',
    date: '2 hours ago',
    url: '#',
  },
  {
    title: 'Industry Report: Market Growth Expected to Double',
    source: 'Gartner',
    summary: 'New research shows significant opportunity for market expansion in the next 3 years.',
    category: 'Industry',
    sentiment: 'positive',
    date: '5 hours ago',
    url: '#',
  },
  {
    title: 'Competitor B Faces Security Breach',
    source: 'Reuters',
    summary: 'Data breach affecting customer information may impact trust and market position.',
    category: 'Security',
    sentiment: 'negative',
    date: '1 day ago',
    url: '#',
  },
  {
    title: 'New Partnership: Competitor C & Major Cloud Provider',
    source: 'Business Wire',
    summary: 'Strategic partnership to accelerate cloud-native offerings and global reach.',
    category: 'Partnership',
    sentiment: 'neutral',
    date: '2 days ago',
    url: '#',
  },
  {
    title: 'Competitor D Launches in European Market',
    source: 'Bloomberg',
    summary: 'European expansion marks significant growth milestone for the competitor.',
    category: 'Expansion',
    sentiment: 'positive',
    date: '3 days ago',
    url: '#',
  },
];

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return 'default';
    case 'negative':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default function NewsFeedPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            News Feed
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with the latest industry and competitor news
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-slate-500">This week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Competitor Mentions</CardTitle>
              <Building2 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-slate-500">This week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68%</div>
              <p className="text-xs text-slate-500">Overall sentiment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Breaking News</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-slate-500">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Latest News</CardTitle>
            <CardDescription>Recent articles and press releases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {newsItems.map((news, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="p-2 bg-white dark:bg-slate-600 rounded-lg">
                    <FileText className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {news.title}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">{news.summary}</p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={news.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSentimentColor(news.sentiment) as any}>
                        {news.sentiment}
                      </Badge>
                      <Badge variant="outline">{news.category}</Badge>
                      <span className="text-xs text-slate-400">
                        {news.source} • {news.date}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
