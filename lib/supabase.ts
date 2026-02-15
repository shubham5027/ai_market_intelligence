import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  competitors: any;
  price_monitoring: any;
  product_changes: any;
  news_articles: any;
  swot_analyses: any;
  market_shifts: any;
  alerts: any;
  executive_reports: any;
  anomaly_detections: any;
  agent_execution_logs: any;
};
