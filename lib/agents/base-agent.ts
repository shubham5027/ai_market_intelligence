import { supabase } from '@/lib/supabase';

export interface AgentConfig {
  name: string;
  description: string;
  model?: string;
  temperature?: number;
  maxRetries?: number;
}

export interface AgentExecutionContext {
  competitorId?: string;
  parameters?: Record<string, any>;
  timestamp: Date;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export abstract class BaseAgent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxRetries: 3,
      ...config,
    };
  }

  abstract execute(context: AgentExecutionContext): Promise<AgentResult>;

  protected async logExecution(
    executionType: string,
    status: string,
    inputData: any,
    outputData?: any,
    error?: string,
    startTime?: number
  ): Promise<void> {
    const duration = startTime ? Date.now() - startTime : 0;

    await supabase.from('agent_execution_logs').insert({
      agent_name: this.config.name,
      execution_type: executionType,
      status,
      input_data: inputData,
      output_data: outputData,
      duration_ms: duration,
      error_message: error,
      executed_at: new Date().toISOString(),
    });
  }

  protected async createAlert(
    alertType: string,
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'critical',
    relatedEntityType?: string,
    relatedEntityId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await supabase.from('alerts').insert({
      alert_type: alertType,
      title,
      message,
      severity,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
      metadata: metadata || {},
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  getName(): string {
    return this.config.name;
  }

  getDescription(): string {
    return this.config.description;
  }
}
