import { BaseAgent, AgentExecutionContext, AgentResult } from './base-agent';
import { supabase } from '@/lib/supabase';
import { callOpenRouter } from '@/lib/llm-client';

export class AnomalyDetectionAgent extends BaseAgent {
  constructor() {
    super({
      name: 'AnomalyDetectionAgent',
      description: 'Detects anomalies and unusual patterns in competitive data',
      model: 'openai/gpt-4-turbo',
      temperature: 0.3,
    });
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      await this.logExecution('anomaly_detection', 'started', context, undefined, undefined, startTime);

      const anomalyData = await this.gatherAnomalyDetectionData();

      const analysis = await callOpenRouter({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: `You are an expert in statistical anomaly detection and pattern recognition.
Analyze the provided data to identify:
1. Unusual pricing patterns
2. Unexpected product changes
3. Abnormal news sentiment shifts
4. Statistical outliers

Assess severity and provide high confidence scores for true anomalies.`,
          },
          {
            role: 'user',
            content: `Data Summary:
${JSON.stringify(anomalyData, null, 2)}

Identify anomalies and return in this format:
{
  "anomalies": [
    {
      "type": "price_anomaly|product_anomaly|sentiment_anomaly|behavioral_anomaly",
      "description": "Detailed description of the anomaly",
      "affectedEntityType": "competitor|product|market",
      "affectedEntityId": "entity_id",
      "severity": "low|medium|high|critical",
      "confidenceScore": 0.92,
      "metrics": {
        "deviation": "statistical deviation",
        "threshold": "threshold crossed",
        "historical_avg": "historical average"
      },
      "possibleCauses": ["cause1", "cause2"],
      "recommendedActions": ["action1", "action2"]
    }
  ],
  "overallRiskLevel": "low|medium|high|critical"
}`,
          },
        ],
        temperature: this.config.temperature,
      });

      const anomaliesData = JSON.parse(analysis);

      for (const anomaly of anomaliesData.anomalies) {
        await supabase.from('anomaly_detections').insert({
          anomaly_type: anomaly.type,
          description: anomaly.description,
          affected_entity_type: anomaly.affectedEntityType,
          affected_entity_id: anomaly.affectedEntityId,
          severity: anomaly.severity,
          confidence_score: anomaly.confidenceScore,
          metrics: anomaly.metrics,
          detected_at: new Date().toISOString(),
        });

        if (anomaly.confidenceScore > 0.85 && (anomaly.severity === 'high' || anomaly.severity === 'critical')) {
          await this.createAlert(
            'anomaly_detected',
            `Anomaly Detected: ${anomaly.type}`,
            anomaly.description,
            anomaly.severity === 'critical' ? 'critical' : 'warning',
            anomaly.affectedEntityType,
            anomaly.affectedEntityId,
            { anomaly }
          );
        }
      }

      await this.logExecution(
        'anomaly_detection',
        'completed',
        context,
        anomaliesData,
        undefined,
        startTime
      );

      return {
        success: true,
        data: anomaliesData,
        confidence: 0.87,
        metadata: {
          anomaliesDetected: anomaliesData.anomalies.length,
          highConfidenceAnomalies: anomaliesData.anomalies.filter((a: any) => a.confidenceScore > 0.85).length,
          riskLevel: anomaliesData.overallRiskLevel,
        },
      };
    } catch (error: any) {
      await this.logExecution(
        'anomaly_detection',
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

  private async gatherAnomalyDetectionData(): Promise<any> {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [recentPricing, historicalPricing, recentProducts, recentNews] = await Promise.all([
      supabase
        .from('price_monitoring')
        .select('*')
        .gte('detected_at', last7Days)
        .order('detected_at', { ascending: false }),
      supabase
        .from('price_monitoring')
        .select('*')
        .gte('detected_at', last30Days)
        .order('detected_at', { ascending: false }),
      supabase
        .from('product_changes')
        .select('*')
        .gte('detected_at', last7Days)
        .order('detected_at', { ascending: false }),
      supabase
        .from('news_articles')
        .select('*')
        .gte('collected_at', last7Days)
        .order('collected_at', { ascending: false }),
    ]);

    return {
      pricingAnalysis: this.analyzePricingAnomalies(
        recentPricing.data || [],
        historicalPricing.data || []
      ),
      productAnalysis: this.analyzeProductAnomalies(recentProducts.data || []),
      sentimentAnalysis: this.analyzeSentimentAnomalies(recentNews.data || []),
    };
  }

  private analyzePricingAnomalies(recent: any[], historical: any[]): any {
    const recentChanges = recent
      .filter((p) => p.change_percentage !== null)
      .map((p) => Math.abs(p.change_percentage));

    const historicalChanges = historical
      .filter((p) => p.change_percentage !== null)
      .map((p) => Math.abs(p.change_percentage));

    const recentAvg = recentChanges.reduce((sum, c) => sum + c, 0) / recentChanges.length || 0;
    const historicalAvg = historicalChanges.reduce((sum, c) => sum + c, 0) / historicalChanges.length || 0;

    return {
      recentAvgChange: recentAvg.toFixed(2),
      historicalAvgChange: historicalAvg.toFixed(2),
      deviation: ((recentAvg - historicalAvg) / (historicalAvg || 1) * 100).toFixed(2),
      extremeChanges: recentChanges.filter((c) => c > 20).length,
      sampleSize: recentChanges.length,
    };
  }

  private analyzeProductAnomalies(products: any[]): any {
    const changeFrequency = products.length;
    const highConfidenceChanges = products.filter((p) => p.confidence_score > 0.8).length;

    return {
      totalChanges: changeFrequency,
      highConfidenceChanges,
      changeVelocity: changeFrequency > 10 ? 'high' : changeFrequency > 5 ? 'medium' : 'low',
    };
  }

  private analyzeSentimentAnomalies(news: any[]): any {
    const sentiments = news.filter((n) => n.sentiment_score !== null);
    const avgSentiment = sentiments.reduce((sum, n) => sum + n.sentiment_score, 0) / sentiments.length || 0;

    const extremeSentiments = sentiments.filter((n) => Math.abs(n.sentiment_score) > 0.7);

    return {
      avgSentiment: avgSentiment.toFixed(2),
      extremeSentimentCount: extremeSentiments.length,
      sentimentVolatility: extremeSentiments.length > 3 ? 'high' : extremeSentiments.length > 1 ? 'medium' : 'low',
    };
  }
}
