import { BaseAgent, AgentExecutionContext, AgentResult } from './base-agent';
import { getSupabase } from '@/lib/supabase';
import { callOpenRouter } from '@/lib/llm-client';
import { tavilySearch } from '@/lib/tavily-agent';

export class MarketShiftAgent extends BaseAgent {
  constructor() {
    super({
      name: 'MarketShiftAgent',
      description: 'Detects market shifts and emerging trends',
      model: 'openai/gpt-4-turbo',
      temperature: 0.6,
    });
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      await this.logExecution('market_shift_detection', 'started', context, undefined, undefined, startTime);

      const marketData = await this.gatherMarketData();

      const analysis = await callOpenRouter({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: `You are a market intelligence expert specializing in trend detection.
Analyze market data across multiple competitors to identify:
1. Emerging trends and patterns
2. Significant market shifts
3. Competitive dynamics changes
4. Industry-wide movements

Assess severity and provide confidence scores.`,
          },
          {
            role: 'user',
            content: `Market Data Summary:
${JSON.stringify(marketData, null, 2)}

Analyze and identify market shifts in this format:
{
  "shifts": [
    {
      "type": "pricing_trend|product_innovation|market_consolidation|technology_shift|customer_preference",
      "description": "Detailed description of the shift",
      "severity": "low|medium|high|critical",
      "affectedCompetitors": ["competitor_id_1", "competitor_id_2"],
      "indicators": {
        "priceChanges": "summary",
        "productChanges": "summary",
        "newsSignals": "summary"
      },
      "confidenceScore": 0.85,
      "predictedImpact": "Short and long-term impact assessment"
    }
  ],
  "overallMarketHealth": "stable|volatile|declining|growing",
  "keyTrends": ["trend1", "trend2"]
}`,
          },
        ],
        temperature: this.config.temperature,
      });

      const shiftsData = JSON.parse(analysis);

      const supabase = getSupabase();
      for (const shift of shiftsData.shifts) {
        await supabase.from('market_shifts').insert({
          shift_type: shift.type,
          description: shift.description,
          severity: shift.severity,
          affected_competitors: shift.affectedCompetitors,
          indicators: shift.indicators,
          confidence_score: shift.confidenceScore,
          detected_at: new Date().toISOString(),
        });

        if (shift.severity === 'critical' || shift.severity === 'high') {
          await this.createAlert(
            'market_shift',
            `Market Shift Detected: ${shift.type}`,
            shift.description,
            shift.severity === 'critical' ? 'critical' : 'warning',
            'market_shift',
            undefined,
            { shift }
          );
        }
      }

      await this.logExecution(
        'market_shift_detection',
        'completed',
        context,
        shiftsData,
        undefined,
        startTime
      );

      return {
        success: true,
        data: shiftsData,
        confidence: 0.8,
        metadata: {
          shiftsDetected: shiftsData.shifts.length,
          criticalShifts: shiftsData.shifts.filter((s: any) => s.severity === 'critical').length,
          marketHealth: shiftsData.overallMarketHealth,
        },
      };
    } catch (error: any) {
      await this.logExecution(
        'market_shift_detection',
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

  private async gatherMarketData(): Promise<any> {
    const supabase = getSupabase();
    const [competitors, recentPricing, recentProducts, recentNews, externalTrends] = await Promise.all([
      supabase.from('competitors').select('*').eq('status', 'active'),
      supabase
        .from('price_monitoring')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(100),
      supabase
        .from('product_changes')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(50),
      supabase
        .from('news_articles')
        .select('*')
        .order('collected_at', { ascending: false })
        .limit(50),
      // Fetch external market trends via Tavily
      this.fetchExternalTrends(),
    ]);

    return {
      competitorCount: competitors.data?.length || 0,
      pricingTrends: this.analyzePricingTrends(recentPricing.data || []),
      productTrends: this.analyzeProductTrends(recentProducts.data || []),
      newsSentiment: this.analyzeNewsSentiment(recentNews.data || []),
      externalTrends,
    };
  }

  private async fetchExternalTrends(): Promise<any> {
    try {
      const queries = [
        'SaaS market trends 2026',
        'enterprise technology shifts',
        'B2B software market outlook',
      ];

      const results = await Promise.all(
        queries.map(q => tavilySearch(q, { maxResults: 3, includeAnswer: true }))
      );

      return {
        marketTrends: results[0]?.answer || null,
        technologyShifts: results[1]?.answer || null,
        marketOutlook: results[2]?.answer || null,
        topSources: results.flatMap(r => r.results?.slice(0, 2) || [])
          .map(s => ({ title: s.title, url: s.url, snippet: s.content?.substring(0, 200) })),
      };
    } catch (error) {
      console.error('Failed to fetch external trends:', error);
      return null;
    }
  }

  private analyzePricingTrends(prices: any[]): any {
    if (prices.length === 0) return { avgChange: 0, volatility: 'low' };

    const changes = prices
      .filter((p) => p.change_percentage !== null)
      .map((p) => p.change_percentage);

    const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
    const variance =
      changes.reduce((sum, c) => sum + Math.pow(c - avgChange, 2), 0) / changes.length;

    return {
      avgChange: avgChange.toFixed(2),
      volatility: variance > 50 ? 'high' : variance > 20 ? 'medium' : 'low',
      sampleSize: changes.length,
    };
  }

  private analyzeProductTrends(products: any[]): any {
    const types = products.reduce((acc, p) => {
      acc[p.change_type] = (acc[p.change_type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalChanges: products.length,
      changesByType: types,
      innovation: types['new_product'] || 0,
    };
  }

  private analyzeNewsSentiment(news: any[]): any {
    if (news.length === 0) return { avgSentiment: 0, tone: 'neutral' };

    const sentiments = news.filter((n) => n.sentiment_score !== null);
    const avgSentiment =
      sentiments.reduce((sum, n) => sum + n.sentiment_score, 0) / sentiments.length;

    return {
      avgSentiment: avgSentiment.toFixed(2),
      tone: avgSentiment > 0.3 ? 'positive' : avgSentiment < -0.3 ? 'negative' : 'neutral',
      articlesAnalyzed: sentiments.length,
    };
  }
}
