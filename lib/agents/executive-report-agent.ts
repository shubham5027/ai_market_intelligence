import { BaseAgent, AgentExecutionContext, AgentResult } from './base-agent';
import { supabase } from '@/lib/supabase';
import { callOpenRouter } from '@/lib/llm-client';

export class ExecutiveReportAgent extends BaseAgent {
  constructor() {
    super({
      name: 'ExecutiveReportAgent',
      description: 'Generates comprehensive executive intelligence reports',
      model: 'openai/gpt-4-turbo',
      temperature: 0.6,
    });
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      await this.logExecution('executive_report', 'started', context, undefined, undefined, startTime);

      const reportPeriod = context.parameters?.period || 'weekly';
      const comprehensiveData = await this.gatherComprehensiveData(reportPeriod);

      const report = await callOpenRouter({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: `You are a senior business intelligence analyst creating executive reports.
Generate a comprehensive, actionable intelligence report that:
1. Summarizes key competitive movements
2. Highlights critical threats and opportunities
3. Provides strategic recommendations
4. Includes key performance metrics
5. Uses clear, executive-level language

Format the report in a structured, professional manner.`,
          },
          {
            role: 'user',
            content: `Period: ${reportPeriod}

Intelligence Data:
${JSON.stringify(comprehensiveData, null, 2)}

Generate an executive intelligence report in this format:
{
  "executiveSummary": "2-3 paragraph overview of key findings",
  "keyInsights": [
    {
      "category": "pricing|products|market|sentiment",
      "insight": "Detailed insight",
      "impact": "high|medium|low",
      "urgency": "immediate|short_term|long_term"
    }
  ],
  "competitiveMovements": [
    {
      "competitor": "Competitor name",
      "action": "Description of action",
      "implications": "Strategic implications",
      "recommendedResponse": "Suggested response"
    }
  ],
  "criticalAlerts": [
    {
      "type": "Alert type",
      "description": "Alert description",
      "priority": "critical|high|medium"
    }
  ],
  "marketTrends": [
    {
      "trend": "Trend description",
      "impact": "Impact assessment",
      "timeframe": "Short/medium/long term"
    }
  ],
  "strategicRecommendations": [
    {
      "recommendation": "Actionable recommendation",
      "rationale": "Why this matters",
      "priority": "high|medium|low",
      "timeline": "Suggested timeline"
    }
  ],
  "metrics": {
    "competitorsMonitored": 0,
    "priceChangesDetected": 0,
    "productUpdates": 0,
    "newsArticlesAnalyzed": 0,
    "anomaliesDetected": 0,
    "averageMarketSentiment": 0
  },
  "confidenceScore": 0.85
}`,
          },
        ],
        temperature: this.config.temperature,
      });

      const reportData = JSON.parse(report);

      const { data: insertedReport } = await supabase
        .from('executive_reports')
        .insert({
          report_period: reportPeriod,
          summary: reportData.executiveSummary,
          key_insights: reportData.keyInsights,
          recommendations: reportData.strategicRecommendations,
          metrics: reportData.metrics,
          generated_by_model: this.config.model,
          confidence_score: reportData.confidenceScore,
          generated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (reportData.criticalAlerts && reportData.criticalAlerts.length > 0) {
        for (const alert of reportData.criticalAlerts) {
          await this.createAlert(
            'executive_report',
            `${alert.type}`,
            alert.description,
            alert.priority === 'critical' ? 'critical' : 'warning',
            'executive_report',
            insertedReport?.id
          );
        }
      }

      await this.logExecution(
        'executive_report',
        'completed',
        context,
        reportData,
        undefined,
        startTime
      );

      return {
        success: true,
        data: reportData,
        confidence: reportData.confidenceScore,
        metadata: {
          reportPeriod,
          insightsGenerated: reportData.keyInsights.length,
          recommendationsProvided: reportData.strategicRecommendations.length,
        },
      };
    } catch (error: any) {
      await this.logExecution(
        'executive_report',
        'failed',
        context,
        undefined,
        error.message,
        startTime
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async gatherComprehensiveData(period: string): Promise<any> {
    const daysBack = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    const [
      competitors,
      prices,
      products,
      news,
      swot,
      marketShifts,
      anomalies,
      alerts,
    ] = await Promise.all([
      supabase.from('competitors').select('*').eq('status', 'active'),
      supabase
        .from('price_monitoring')
        .select('*')
        .gte('detected_at', startDate)
        .order('detected_at', { ascending: false }),
      supabase
        .from('product_changes')
        .select('*')
        .gte('detected_at', startDate)
        .order('detected_at', { ascending: false }),
      supabase
        .from('news_articles')
        .select('*')
        .gte('collected_at', startDate)
        .order('collected_at', { ascending: false }),
      supabase
        .from('swot_analyses')
        .select('*')
        .gte('analyzed_at', startDate)
        .order('analyzed_at', { ascending: false }),
      supabase
        .from('market_shifts')
        .select('*')
        .gte('detected_at', startDate)
        .order('detected_at', { ascending: false }),
      supabase
        .from('anomaly_detections')
        .select('*')
        .gte('detected_at', startDate)
        .order('detected_at', { ascending: false }),
      supabase
        .from('alerts')
        .select('*')
        .gte('created_at', startDate)
        .eq('is_read', false)
        .order('created_at', { ascending: false }),
    ]);

    return {
      period,
      competitorsSummary: {
        total: competitors.data?.length || 0,
        active: competitors.data?.filter((c) => c.status === 'active').length || 0,
      },
      pricingActivity: {
        totalChanges: prices.data?.length || 0,
        significantChanges: prices.data?.filter((p) => Math.abs(p.change_percentage || 0) > 10).length || 0,
        averageChange: this.calculateAverageChange(prices.data || []),
      },
      productActivity: {
        totalChanges: products.data?.length || 0,
        newProducts: products.data?.filter((p) => p.change_type === 'new_product').length || 0,
        removedProducts: products.data?.filter((p) => p.change_type === 'removed_product').length || 0,
      },
      newsAnalysis: {
        totalArticles: news.data?.length || 0,
        averageSentiment: this.calculateAverageSentiment(news.data || []),
        topSources: this.getTopSources(news.data || []),
      },
      swotHighlights: this.extractSWOTHighlights(swot.data || []),
      marketShifts: marketShifts.data || [],
      anomalies: anomalies.data || [],
      unreadAlerts: alerts.data || [],
    };
  }

  private calculateAverageChange(prices: any[]): number {
    if (prices.length === 0) return 0;
    const changes = prices
      .filter((p) => p.change_percentage !== null)
      .map((p) => p.change_percentage);
    return changes.reduce((sum, c) => sum + c, 0) / changes.length;
  }

  private calculateAverageSentiment(news: any[]): number {
    if (news.length === 0) return 0;
    const sentiments = news.filter((n) => n.sentiment_score !== null);
    return sentiments.reduce((sum, n) => sum + n.sentiment_score, 0) / sentiments.length;
  }

  private getTopSources(news: any[]): string[] {
    const sources = news.reduce((acc, n) => {
      acc[n.source] = (acc[n.source] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(sources)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([source]) => source);
  }

  private extractSWOTHighlights(swotData: any[]): any {
    if (swotData.length === 0) return null;

    const latest = swotData[0];
    return {
      topStrengths: latest.strengths.slice(0, 3),
      topThreats: latest.threats.slice(0, 3),
      overallScore: latest.overall_score,
    };
  }
}
