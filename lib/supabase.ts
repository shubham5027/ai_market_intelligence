import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    supabaseUrl !== 'your_supabase_url' &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your_supabase_anon_key'
  );
};

// Create client only if configured, otherwise return a mock that throws helpful errors
let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;

// Helper to get supabase with error handling
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(
      'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file. ' +
      'Get these values from your Supabase project at https://supabase.com → Project Settings → API'
    );
  }
  return supabaseClient;
}

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
