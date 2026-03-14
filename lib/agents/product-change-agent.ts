import { BaseAgent, AgentExecutionContext, AgentResult } from './base-agent';
import { getSupabase } from '@/lib/supabase';
import { callOpenRouter } from '@/lib/llm-client';
import { scrapeWebsite } from '@/lib/scraper';

export class ProductChangeAgent extends BaseAgent {
  constructor() {
    super({
      name: 'ProductChangeAgent',
      description: 'Detects changes in competitor products and features',
      model: 'anthropic/claude-3-haiku',
      temperature: 0.3,
    });
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      await this.logExecution('product_change_detection', 'started', context, undefined, undefined, startTime);

      const { competitorId } = context;
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

      const currentState = await scrapeWebsite(competitor.website, {
        extractProducts: true,
        extractFeatures: true,
      });

      const previousChanges = await this.getPreviousState(competitorId);

      const analysis = await callOpenRouter({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: `You are a product analysis expert. Compare current and previous product states to detect changes.
Identify new products, removed products, feature changes, and availability changes.
Provide confidence scores for each detected change.
Return results in JSON format.`,
          },
          {
            role: 'user',
            content: `Current state: ${JSON.stringify(currentState)}

Previous state: ${JSON.stringify(previousChanges.slice(0, 5))}

Analyze and return changes in this format:
{
  "changes": [
    {
      "type": "new_product|removed_product|feature_change|availability_change",
      "productName": "Product Name",
      "description": "Detailed description of the change",
      "beforeState": {},
      "afterState": {},
      "confidenceScore": 0.9
    }
  ]
}`,
          },
        ],
        temperature: this.config.temperature,
      });

      const changesData = JSON.parse(analysis);

      for (const change of changesData.changes) {
        await supabase.from('product_changes').insert({
          competitor_id: competitorId,
          change_type: change.type,
          product_name: change.productName,
          description: change.description,
          before_state: change.beforeState,
          after_state: change.afterState,
          confidence_score: change.confidenceScore,
          detected_at: new Date().toISOString(),
        });

        if (change.confidenceScore > 0.8) {
          await this.createAlert(
            'product_change',
            `Product Change Detected: ${change.productName}`,
            change.description,
            change.type === 'removed_product' ? 'warning' : 'info',
            'competitor',
            competitorId,
            { change }
          );
        }
      }

      await this.logExecution(
        'product_change_detection',
        'completed',
        context,
        changesData,
        undefined,
        startTime
      );

      return {
        success: true,
        data: changesData,
        confidence: 0.82,
        metadata: {
          changesDetected: changesData.changes.length,
          highConfidenceChanges: changesData.changes.filter((c: any) => c.confidenceScore > 0.8).length,
        },
      };
    } catch (error: any) {
      await this.logExecution(
        'product_change_detection',
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

  private async getPreviousState(competitorId: string): Promise<any[]> {
    const { data } = await getSupabase()
      .from('product_changes')
      .select('*')
      .eq('competitor_id', competitorId)
      .order('detected_at', { ascending: false })
      .limit(20);

    return data || [];
  }
}
