import { BaseAgent, AgentExecutionContext, AgentResult } from './base-agent';
import { getSupabase } from '@/lib/supabase';
import { callOpenRouter } from '@/lib/llm-client';

// Type definitions for structured SWOT output
export interface SWOTInsight {
  title: string;
  description: string;
  supporting_evidence: string[];
  impact_score: number; // 0-100
  confidence_score: number; // 0-1
  time_horizon: 'short_term' | 'mid_term' | 'long_term';
}

export interface SWOTAnalysisResult {
  competitor: string;
  analysis_period: string;
  strengths: SWOTInsight[];
  weaknesses: SWOTInsight[];
  opportunities: SWOTInsight[];
  threats: SWOTInsight[];
  executive_summary: {
    top_risks: string[];
    top_opportunities: string[];
    strategic_recommendation: string;
  };
}

// Structured SWOT prompt template
const SWOT_SYSTEM_PROMPT = `Your role is to generate a structured SWOT analysis using ONLY the provided structured data inputs.

STRICT RULES:
- Do NOT hallucinate.
- Do NOT invent missing data.
- If evidence is insufficient, explicitly state "Insufficient data".
- Every SWOT item MUST reference supporting evidence from the provided inputs.
- Every insight must include:
    - title
    - description
    - supporting_evidence
    - impact_score (0-100)
    - confidence_score (0-1)
    - time_horizon (short_term | mid_term | long_term)

ANALYSIS FRAMEWORK:

STRENGTHS:
Competitive advantages demonstrated by the competitor based on pricing, features, sentiment, product velocity, funding, or market presence.

WEAKNESSES:
Documented vulnerabilities such as negative sentiment, product gaps, instability, complaints, declining performance, or negative press.

OPPORTUNITIES:
Areas where our organization can strategically benefit due to competitor weaknesses, gaps, or emerging market conditions.

THREATS:
Direct or indirect risks posed to our organization based on competitor actions, pricing shifts, feature launches, funding events, sentiment growth, or expansion moves.

SCORING RULES:

impact_score:
- 80-100 = High strategic impact
- 50-79 = Moderate impact
- 20-49 = Low impact
- 0-19 = Minimal impact

confidence_score:
Based on:
- Number of supporting sources
- Recency of data
- Consistency of signals

TIME HORIZON:
short_term = immediate or within 30 days
mid_term = 1-3 months
long_term = 3+ months

OUTPUT FORMAT:
Return strictly valid JSON using this structure:

{
  "competitor": "string",
  "analysis_period": "string",
  "strengths": [],
  "weaknesses": [],
  "opportunities": [],
  "threats": [],
  "executive_summary": {
      "top_risks": [],
      "top_opportunities": [],
      "strategic_recommendation": "string"
  }
}

Do not include any commentary outside JSON.`;

export class SWOTAnalysisAgent extends BaseAgent {
  constructor() {
    super({
      name: 'SWOTAnalysisAgent',
      description: 'Performs comprehensive SWOT analysis on competitors using structured evidence-based methodology',
      model: 'openai/gpt-4-turbo',
      temperature: 0.3, // Lower temperature for more consistent structured output
    });
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      await this.logExecution('swot_analysis', 'started', context, undefined, undefined, startTime);

      const { competitorId, companyContext } = context;
      if (!competitorId) {
        throw new Error('Competitor ID is required');
      }

      const supabase = getSupabase();
      const { data: competitor } = await supabase
        .from('competitors')
        .select('*')
        .eq('id', competitorId)
        .maybeSingle();

      if (!competitor) {
        throw new Error('Competitor not found');
      }

      // Gather all structured data inputs
      const structuredData = await this.gatherStructuredData(competitorId);

      // Build analysis period string
      const analysisPeriod = this.getAnalysisPeriod(structuredData);

      // Build the user prompt with structured data inputs
      const userPrompt = this.buildUserPrompt(
        competitor.name,
        analysisPeriod,
        structuredData,
        companyContext
      );

      const analysis = await callOpenRouter({
        model: this.config.model!,
        messages: [
          { role: 'system', content: SWOT_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: this.config.temperature,
      });

      // Parse and validate the response
      const swotData = this.parseAndValidateSWOT(analysis, competitor.name, analysisPeriod);

      // Save to database
      await supabase.from('swot_analyses').insert({
        competitor_id: competitorId,
        strengths: swotData.strengths,
        weaknesses: swotData.weaknesses,
        opportunities: swotData.opportunities,
        threats: swotData.threats,
        overall_score: this.calculateOverallScore(swotData),
        confidence_score: this.calculateAverageConfidence(swotData),
        analyzed_at: new Date().toISOString(),
      });

      // Create alerts for high-impact threats
      const criticalThreats = swotData.threats.filter(
        (t) => t.impact_score >= 80 && t.confidence_score >= 0.7
      );

      if (criticalThreats.length > 0) {
        await this.createAlert(
          'swot_threat',
          `Critical Threats Identified for ${competitor.name}`,
          `${criticalThreats.length} high-impact threats detected: ${criticalThreats.map(t => t.title).join(', ')}`,
          'critical',
          'competitor',
          competitorId,
          { threats: criticalThreats, executive_summary: swotData.executive_summary }
        );
      }

      // Create alerts for high-impact opportunities
      const significantOpportunities = swotData.opportunities.filter(
        (o) => o.impact_score >= 70 && o.confidence_score >= 0.6
      );

      if (significantOpportunities.length > 0) {
        await this.createAlert(
          'swot_opportunity',
          `Strategic Opportunities vs ${competitor.name}`,
          `${significantOpportunities.length} high-potential opportunities identified`,
          'info',
          'competitor',
          competitorId,
          { opportunities: significantOpportunities }
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
        confidence: this.calculateAverageConfidence(swotData),
        metadata: {
          overallScore: this.calculateOverallScore(swotData),
          strengthsCount: swotData.strengths.length,
          weaknessesCount: swotData.weaknesses.length,
          opportunitiesCount: swotData.opportunities.length,
          threatsCount: swotData.threats.length,
          analysisPeriod,
          dataCompleteness: this.assessDataCompleteness(structuredData),
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

  private buildUserPrompt(
    competitorName: string,
    analysisPeriod: string,
    data: any,
    companyContext?: string
  ): string {
    return `Competitor Name: ${competitorName}
Analysis Period: ${analysisPeriod}

Price Monitoring Data:
${JSON.stringify(data.priceData, null, 2)}

Product Change Data:
${JSON.stringify(data.productChanges, null, 2)}

News & Sentiment Data:
${JSON.stringify(data.newsSentiment, null, 2)}

Market Shift Data:
${JSON.stringify(data.marketShifts, null, 2)}

Anomaly Detection Data:
${JSON.stringify(data.anomalies, null, 2)}

Internal Company Context:
${companyContext || 'No internal company context provided. Analyze from general competitive perspective.'}`;
  }

  private async gatherStructuredData(competitorId: string): Promise<any> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const db = getSupabase();
    const [prices, products, news, marketShifts, anomalies] = await Promise.all([
      // Price monitoring data
      db
        .from('price_monitoring')
        .select('product_name, old_price, new_price, change_percentage, currency, detected_at')
        .eq('competitor_id', competitorId)
        .gte('detected_at', ninetyDaysAgo)
        .order('detected_at', { ascending: false })
        .limit(50),

      // Product changes
      db
        .from('product_changes')
        .select('change_type, title, description, significance, detected_at')
        .eq('competitor_id', competitorId)
        .gte('detected_at', ninetyDaysAgo)
        .order('detected_at', { ascending: false })
        .limit(30),

      // News and sentiment data
      db
        .from('news_articles')
        .select('title, summary, source, sentiment_score, relevance_score, collected_at')
        .eq('competitor_id', competitorId)
        .gte('collected_at', thirtyDaysAgo)
        .order('collected_at', { ascending: false })
        .limit(20),

      // Market shifts
      db
        .from('market_shifts')
        .select('shift_type, description, impact_level, confidence_score, detected_at')
        .gte('detected_at', ninetyDaysAgo)
        .order('detected_at', { ascending: false })
        .limit(15),

      // Anomaly detections
      db
        .from('anomaly_detections')
        .select('anomaly_type, description, severity, data_source, detected_at')
        .eq('competitor_id', competitorId)
        .gte('detected_at', ninetyDaysAgo)
        .order('detected_at', { ascending: false })
        .limit(10),
    ]);

    // Process and structure the data for LLM consumption
    return {
      priceData: this.processPriceData(prices.data || []),
      productChanges: this.processProductChanges(products.data || []),
      newsSentiment: this.processNewsSentiment(news.data || []),
      marketShifts: marketShifts.data || [],
      anomalies: anomalies.data || [],
    };
  }

  private processPriceData(prices: any[]): any {
    if (prices.length === 0) {
      return { status: 'Insufficient data', items: [] };
    }

    const priceIncreases = prices.filter(p => p.change_percentage > 0);
    const priceDecreases = prices.filter(p => p.change_percentage < 0);
    const avgChange = prices.reduce((sum, p) => sum + (p.change_percentage || 0), 0) / prices.length;

    return {
      total_changes: prices.length,
      increases: priceIncreases.length,
      decreases: priceDecreases.length,
      average_change_percentage: avgChange.toFixed(2),
      trend: avgChange > 2 ? 'increasing' : avgChange < -2 ? 'decreasing' : 'stable',
      recent_changes: prices.slice(0, 10).map(p => ({
        product: p.product_name,
        change: `${p.change_percentage > 0 ? '+' : ''}${p.change_percentage?.toFixed(1)}%`,
        from: p.old_price,
        to: p.new_price,
        currency: p.currency,
        date: p.detected_at,
      })),
    };
  }

  private processProductChanges(changes: any[]): any {
    if (changes.length === 0) {
      return { status: 'Insufficient data', items: [] };
    }

    const byType = changes.reduce((acc: any, c) => {
      acc[c.change_type] = (acc[c.change_type] || 0) + 1;
      return acc;
    }, {});

    const highSignificance = changes.filter(c => c.significance === 'high');

    return {
      total_changes: changes.length,
      by_type: byType,
      high_significance_count: highSignificance.length,
      recent_significant: highSignificance.slice(0, 5).map(c => ({
        type: c.change_type,
        title: c.title,
        description: c.description,
        significance: c.significance,
        date: c.detected_at,
      })),
      all_changes: changes.map(c => ({
        type: c.change_type,
        title: c.title,
        significance: c.significance,
        date: c.detected_at,
      })),
    };
  }

  private processNewsSentiment(news: any[]): any {
    if (news.length === 0) {
      return { status: 'Insufficient data', items: [] };
    }

    const avgSentiment = news.reduce((sum, n) => sum + (n.sentiment_score || 0), 0) / news.length;
    const positive = news.filter(n => (n.sentiment_score || 0) > 0.3).length;
    const negative = news.filter(n => (n.sentiment_score || 0) < -0.3).length;
    const neutral = news.length - positive - negative;

    return {
      total_articles: news.length,
      sentiment_distribution: { positive, negative, neutral },
      average_sentiment: avgSentiment.toFixed(2),
      overall_sentiment: avgSentiment > 0.2 ? 'positive' : avgSentiment < -0.2 ? 'negative' : 'neutral',
      top_stories: news.slice(0, 5).map(n => ({
        title: n.title,
        summary: n.summary,
        source: n.source,
        sentiment: n.sentiment_score > 0.3 ? 'positive' : n.sentiment_score < -0.3 ? 'negative' : 'neutral',
        sentiment_score: n.sentiment_score?.toFixed(2),
        date: n.collected_at,
      })),
    };
  }

  private getAnalysisPeriod(data: any): string {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return `${thirtyDaysAgo.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`;
  }

  private parseAndValidateSWOT(response: string, competitorName: string, period: string): SWOTAnalysisResult {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response];
      const jsonStr = jsonMatch[1] || response;
      const parsed = JSON.parse(jsonStr.trim());

      // Validate and ensure structure
      return {
        competitor: parsed.competitor || competitorName,
        analysis_period: parsed.analysis_period || period,
        strengths: this.validateInsights(parsed.strengths || []),
        weaknesses: this.validateInsights(parsed.weaknesses || []),
        opportunities: this.validateInsights(parsed.opportunities || []),
        threats: this.validateInsights(parsed.threats || []),
        executive_summary: {
          top_risks: parsed.executive_summary?.top_risks || [],
          top_opportunities: parsed.executive_summary?.top_opportunities || [],
          strategic_recommendation: parsed.executive_summary?.strategic_recommendation || 'Analysis pending additional data.',
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse SWOT analysis response: ${error}`);
    }
  }

  private validateInsights(insights: any[]): SWOTInsight[] {
    return insights.map((insight) => ({
      title: insight.title || 'Untitled',
      description: insight.description || '',
      supporting_evidence: Array.isArray(insight.supporting_evidence)
        ? insight.supporting_evidence
        : [insight.supporting_evidence || 'No evidence provided'],
      impact_score: Math.min(100, Math.max(0, Number(insight.impact_score) || 50)),
      confidence_score: Math.min(1, Math.max(0, Number(insight.confidence_score) || 0.5)),
      time_horizon: ['short_term', 'mid_term', 'long_term'].includes(insight.time_horizon)
        ? insight.time_horizon
        : 'mid_term',
    }));
  }

  private calculateOverallScore(swot: SWOTAnalysisResult): number {
    const strengthScore = swot.strengths.reduce((sum, s) => sum + s.impact_score * s.confidence_score, 0);
    const weaknessScore = swot.weaknesses.reduce((sum, w) => sum + w.impact_score * w.confidence_score, 0);
    const opportunityScore = swot.opportunities.reduce((sum, o) => sum + o.impact_score * o.confidence_score, 0);
    const threatScore = swot.threats.reduce((sum, t) => sum + t.impact_score * t.confidence_score, 0);

    const totalItems = swot.strengths.length + swot.weaknesses.length + swot.opportunities.length + swot.threats.length;
    if (totalItems === 0) return 50;

    // Positive factors minus negative factors, normalized to 0-100
    const rawScore = ((strengthScore + opportunityScore) - (weaknessScore + threatScore)) / totalItems;
    return Math.min(100, Math.max(0, 50 + rawScore / 2));
  }

  private calculateAverageConfidence(swot: SWOTAnalysisResult): number {
    const allInsights = [...swot.strengths, ...swot.weaknesses, ...swot.opportunities, ...swot.threats];
    if (allInsights.length === 0) return 0.5;
    return allInsights.reduce((sum, i) => sum + i.confidence_score, 0) / allInsights.length;
  }

  private assessDataCompleteness(data: any): string {
    const hasPrice = data.priceData?.total_changes > 0;
    const hasProduct = data.productChanges?.total_changes > 0;
    const hasNews = data.newsSentiment?.total_articles > 0;
    const hasMarket = data.marketShifts?.length > 0;
    const hasAnomalies = data.anomalies?.length > 0;

    const completeness = [hasPrice, hasProduct, hasNews, hasMarket, hasAnomalies].filter(Boolean).length;

    if (completeness >= 4) return 'high';
    if (completeness >= 2) return 'moderate';
    return 'low';
  }
}
