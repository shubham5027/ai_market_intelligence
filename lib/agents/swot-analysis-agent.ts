import { BaseAgent, AgentExecutionContext, AgentResult } from './base-agent';
import { supabase } from '@/lib/supabase';
import { callOpenRouter } from '@/lib/llm-client';

export class SWOTAnalysisAgent extends BaseAgent {
  constructor() {
    super({
      name: 'SWOTAnalysisAgent',
      description: 'Performs comprehensive SWOT analysis on competitors',
      model: 'openai/gpt-4-turbo',
      temperature: 0.5,
    });
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      await this.logExecution('swot_analysis', 'started', context, undefined, undefined, startTime);

      const { competitorId } = context;
      if (!competitorId) {
        throw new Error('Competitor ID is required');
      }

      const { data: competitor } = await supabase
        .from('competitors')
        .select('*')
        .eq('id', competitorId)
        .maybeSingle();

      if (!competitor) {
        throw new Error('Competitor not found');
      }

      const historicalData = await this.gatherHistoricalData(competitorId);

      const analysis = await callOpenRouter({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: `You are a strategic business analyst expert in competitive intelligence.
Perform a comprehensive SWOT analysis based on the provided data.
Consider pricing trends, product changes, news sentiment, and market position.
Provide actionable insights and rate the overall competitive strength.`,
          },
          {
            role: 'user',
            content: `Competitor: ${competitor.name}
Industry: ${competitor.industry}
Website: ${competitor.website}

Historical Data:
${JSON.stringify(historicalData, null, 2)}

Perform a detailed SWOT analysis and return in this format:
{
  "strengths": [
    { "item": "Strength description", "impact": "high|medium|low", "evidence": "Supporting data" }
  ],
  "weaknesses": [
    { "item": "Weakness description", "impact": "high|medium|low", "evidence": "Supporting data" }
  ],
  "opportunities": [
    { "item": "Opportunity description", "potential": "high|medium|low", "timeframe": "short|medium|long" }
  ],
  "threats": [
    { "item": "Threat description", "severity": "high|medium|low", "likelihood": "high|medium|low" }
  ],
  "overallScore": 75,
  "keyInsights": ["Insight 1", "Insight 2"],
  "strategicRecommendations": ["Recommendation 1", "Recommendation 2"]
}`,
          },
        ],
        temperature: this.config.temperature,
      });

      const swotData = JSON.parse(analysis);

      await supabase.from('swot_analyses').insert({
        competitor_id: competitorId,
        strengths: swotData.strengths,
        weaknesses: swotData.weaknesses,
        opportunities: swotData.opportunities,
        threats: swotData.threats,
        overall_score: swotData.overallScore,
        confidence_score: 0.85,
        analyzed_at: new Date().toISOString(),
      });

      const criticalThreats = swotData.threats.filter(
        (t: any) => t.severity === 'high' && t.likelihood === 'high'
      );

      if (criticalThreats.length > 0) {
        await this.createAlert(
          'swot_threat',
          `Critical Threats Identified for ${competitor.name}`,
          `${criticalThreats.length} high-severity threats detected`,
          'critical',
          'competitor',
          competitorId,
          { threats: criticalThreats }
        );
      }

      await this.logExecution(
        'swot_analysis',
        'completed',
        context,
        swotData,
        undefined,
        startTime
      );

      return {
        success: true,
        data: swotData,
        confidence: 0.85,
        metadata: {
          overallScore: swotData.overallScore,
          strengthsCount: swotData.strengths.length,
          threatsCount: swotData.threats.length,
        },
      };
    } catch (error: any) {
      await this.logExecution(
        'swot_analysis',
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

  private async gatherHistoricalData(competitorId: string): Promise<any> {
    const [prices, products, news, previousSwot] = await Promise.all([
      supabase
        .from('price_monitoring')
        .select('*')
        .eq('competitor_id', competitorId)
        .order('detected_at', { ascending: false })
        .limit(20),
      supabase
        .from('product_changes')
        .select('*')
        .eq('competitor_id', competitorId)
        .order('detected_at', { ascending: false })
        .limit(20),
      supabase
        .from('news_articles')
        .select('*')
        .eq('competitor_id', competitorId)
        .order('collected_at', { ascending: false })
        .limit(10),
      supabase
        .from('swot_analyses')
        .select('*')
        .eq('competitor_id', competitorId)
        .order('analyzed_at', { ascending: false })
        .limit(1),
    ]);

    return {
      recentPricing: prices.data || [],
      productChanges: products.data || [],
      recentNews: news.data || [],
      previousAnalysis: previousSwot.data?.[0] || null,
    };
  }
}
