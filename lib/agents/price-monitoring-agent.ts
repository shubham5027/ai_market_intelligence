import { BaseAgent, AgentExecutionContext, AgentResult } from './base-agent';
import { supabase } from '@/lib/supabase';
import { callOpenRouter } from '@/lib/llm-client';
import { scrapeWebsite } from '@/lib/scraper';

export class PriceMonitoringAgent extends BaseAgent {
  constructor() {
    super({
      name: 'PriceMonitoringAgent',
      description: 'Monitors competitor pricing and detects changes',
      model: 'anthropic/claude-3-haiku',
      temperature: 0.3,
    });
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      await this.logExecution('price_monitoring', 'started', context, undefined, undefined, startTime);

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

      const scrapedData = await scrapeWebsite(competitor.website, {
        extractPricing: true,
      });

      const previousPrices = await this.getPreviousPrices(competitorId);

      const analysis = await callOpenRouter({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: `You are a pricing analysis expert. Analyze the scraped pricing data and compare it with historical prices.
Extract product names, SKUs, prices, and detect any significant changes.
Return a JSON array of products with their current prices and change information.`,
          },
          {
            role: 'user',
            content: `Current scraped data: ${JSON.stringify(scrapedData)}

Previous prices: ${JSON.stringify(previousPrices)}

Analyze and return pricing information in this format:
{
  "products": [
    {
      "name": "Product Name",
      "sku": "SKU123",
      "price": 99.99,
      "currency": "USD",
      "changePercentage": 5.2,
      "isSignificant": true
    }
  ]
}`,
          },
        ],
        temperature: this.config.temperature,
      });

      const pricingData = JSON.parse(analysis);

      for (const product of pricingData.products) {
        await supabase.from('price_monitoring').insert({
          competitor_id: competitorId,
          product_name: product.name,
          product_sku: product.sku,
          price: product.price,
          currency: product.currency,
          url: competitor.website,
          change_percentage: product.changePercentage,
          metadata: { isSignificant: product.isSignificant },
          detected_at: new Date().toISOString(),
        });

        if (product.isSignificant && Math.abs(product.changePercentage) > 10) {
          await this.createAlert(
            'price_change',
            `Significant Price Change Detected`,
            `${competitor.name} changed ${product.name} price by ${product.changePercentage.toFixed(1)}%`,
            'warning',
            'competitor',
            competitorId,
            { product, changePercentage: product.changePercentage }
          );
        }
      }

      await this.logExecution(
        'price_monitoring',
        'completed',
        context,
        pricingData,
        undefined,
        startTime
      );

      return {
        success: true,
        data: pricingData,
        confidence: 0.85,
        metadata: {
          productsAnalyzed: pricingData.products.length,
          significantChanges: pricingData.products.filter((p: any) => p.isSignificant).length,
        },
      };
    } catch (error: any) {
      await this.logExecution(
        'price_monitoring',
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

  private async getPreviousPrices(competitorId: string): Promise<any[]> {
    const { data } = await supabase
      .from('price_monitoring')
      .select('*')
      .eq('competitor_id', competitorId)
      .order('detected_at', { ascending: false })
      .limit(50);

    return data || [];
  }
}
