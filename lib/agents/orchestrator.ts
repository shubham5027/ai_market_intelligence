import { BaseAgent, AgentExecutionContext, AgentResult } from './base-agent';
import { PriceMonitoringAgent } from './price-monitoring-agent';
import { ProductChangeAgent } from './product-change-agent';
import { NewsAggregationAgent } from './news-aggregation-agent';
import { SWOTAnalysisAgent } from './swot-analysis-agent';
import { MarketShiftAgent } from './market-shift-agent';
import { AnomalyDetectionAgent } from './anomaly-detection-agent';
import { getSupabase } from '@/lib/supabase';

export interface OrchestrationPlan {
  agents: string[];
  competitorId?: string;
  parallel?: boolean;
  parameters?: Record<string, any>;
}

export interface OrchestrationResult {
  success: boolean;
  results: Record<string, AgentResult>;
  summary: {
    totalAgents: number;
    successfulAgents: number;
    failedAgents: number;
    totalDuration: number;
  };
}

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent>;

  constructor() {
    this.agents = new Map();
    this.registerAgents();
  }

  private registerAgents(): void {
    this.agents.set('price_monitoring', new PriceMonitoringAgent());
    this.agents.set('product_change', new ProductChangeAgent());
    this.agents.set('news_aggregation', new NewsAggregationAgent());
    this.agents.set('swot_analysis', new SWOTAnalysisAgent());
    this.agents.set('market_shift', new MarketShiftAgent());
    this.agents.set('anomaly_detection', new AnomalyDetectionAgent());
  }

  async executeAgents(plan: OrchestrationPlan): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const results: Record<string, AgentResult> = {};

    const context: AgentExecutionContext = {
      competitorId: plan.competitorId,
      parameters: plan.parameters,
      timestamp: new Date(),
    };

    if (plan.parallel) {
      const promises = plan.agents.map(async (agentName) => {
        const agent = this.agents.get(agentName);
        if (agent) {
          const result = await agent.execute(context);
          results[agentName] = result;
        }
      });

      await Promise.all(promises);
    } else {
      for (const agentName of plan.agents) {
        const agent = this.agents.get(agentName);
        if (agent) {
          results[agentName] = await agent.execute(context);
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    const successfulAgents = Object.values(results).filter((r) => r.success).length;
    const failedAgents = Object.values(results).filter((r) => !r.success).length;

    return {
      success: failedAgents === 0,
      results,
      summary: {
        totalAgents: plan.agents.length,
        successfulAgents,
        failedAgents,
        totalDuration,
      },
    };
  }

  async executeFullScan(competitorId: string): Promise<OrchestrationResult> {
    const plan: OrchestrationPlan = {
      agents: [
        'price_monitoring',
        'product_change',
        'news_aggregation',
        'swot_analysis',
        'anomaly_detection',
      ],
      competitorId,
      parallel: true,
    };

    return this.executeAgents(plan);
  }

  async executeMarketAnalysis(): Promise<OrchestrationResult> {
    const plan: OrchestrationPlan = {
      agents: ['market_shift', 'anomaly_detection'],
      parallel: false,
    };

    return this.executeAgents(plan);
  }

  async executeCompetitorMonitoring(): Promise<void> {
    const { data: competitors } = await getSupabase()
      .from('competitors')
      .select('*')
      .eq('status', 'active');

    if (!competitors || competitors.length === 0) {
      console.log('No active competitors to monitor');
      return;
    }

    for (const competitor of competitors) {
      try {
        await this.executeFullScan(competitor.id);
        console.log(`Completed monitoring for ${competitor.name}`);
      } catch (error: any) {
        console.error(`Failed to monitor ${competitor.name}:`, error.message);
      }
    }

    await this.executeMarketAnalysis();
  }

  getAvailableAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }
}

export const orchestrator = new AgentOrchestrator();
