-- =============================================
-- COMPETITIVE INTELLIGENCE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Create competitors table
CREATE TABLE IF NOT EXISTS competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text NOT NULL,
  website text,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create price_monitoring table
CREATE TABLE IF NOT EXISTS price_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid REFERENCES competitors(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  product_sku text,
  price numeric NOT NULL,
  currency text DEFAULT 'USD',
  url text,
  change_percentage numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  detected_at timestamptz DEFAULT now()
);

-- Create product_changes table
CREATE TABLE IF NOT EXISTS product_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid REFERENCES competitors(id) ON DELETE CASCADE,
  change_type text NOT NULL,
  product_name text NOT NULL,
  description text,
  before_state jsonb,
  after_state jsonb,
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  detected_at timestamptz DEFAULT now()
);

-- Create news_articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid REFERENCES competitors(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  summary text,
  source text,
  url text,
  sentiment_score numeric CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  published_at timestamptz,
  collected_at timestamptz DEFAULT now()
);

-- Create swot_analyses table
CREATE TABLE IF NOT EXISTS swot_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid REFERENCES competitors(id) ON DELETE CASCADE,
  strengths jsonb DEFAULT '[]'::jsonb,
  weaknesses jsonb DEFAULT '[]'::jsonb,
  opportunities jsonb DEFAULT '[]'::jsonb,
  threats jsonb DEFAULT '[]'::jsonb,
  overall_score numeric CHECK (overall_score >= 0 AND overall_score <= 100),
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  analyzed_at timestamptz DEFAULT now()
);

-- Create market_shifts table
CREATE TABLE IF NOT EXISTS market_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_type text NOT NULL,
  description text NOT NULL,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_competitors jsonb DEFAULT '[]'::jsonb,
  indicators jsonb DEFAULT '{}'::jsonb,
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  detected_at timestamptz DEFAULT now()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  severity text CHECK (severity IN ('info', 'warning', 'critical')),
  related_entity_type text,
  related_entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create executive_reports table
CREATE TABLE IF NOT EXISTS executive_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_period text NOT NULL,
  summary text NOT NULL,
  key_insights jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  metrics jsonb DEFAULT '{}'::jsonb,
  generated_by_model text,
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  generated_at timestamptz DEFAULT now()
);

-- Create anomaly_detections table
CREATE TABLE IF NOT EXISTS anomaly_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_type text NOT NULL,
  description text NOT NULL,
  affected_entity_type text,
  affected_entity_id uuid,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  metrics jsonb DEFAULT '{}'::jsonb,
  detected_at timestamptz DEFAULT now()
);

-- Create agent_execution_logs table
CREATE TABLE IF NOT EXISTS agent_execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  execution_type text NOT NULL,
  status text CHECK (status IN ('started', 'running', 'completed', 'failed')),
  input_data jsonb,
  output_data jsonb,
  duration_ms integer,
  error_message text,
  executed_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_price_monitoring_competitor ON price_monitoring(competitor_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_changes_competitor ON product_changes(competitor_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_competitor ON news_articles(competitor_id, collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_swot_analyses_competitor ON swot_analyses(competitor_id, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_entity ON anomaly_detections(affected_entity_type, affected_entity_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_status ON agent_execution_logs(status, executed_at DESC);

-- Enable Row Level Security
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE swot_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_execution_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public/anon access (for development)
-- competitors
CREATE POLICY "Allow public read competitors" ON competitors FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert competitors" ON competitors FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update competitors" ON competitors FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete competitors" ON competitors FOR DELETE TO anon USING (true);

-- price_monitoring
CREATE POLICY "Allow public read price_monitoring" ON price_monitoring FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert price_monitoring" ON price_monitoring FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update price_monitoring" ON price_monitoring FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete price_monitoring" ON price_monitoring FOR DELETE TO anon USING (true);

-- product_changes
CREATE POLICY "Allow public read product_changes" ON product_changes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert product_changes" ON product_changes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update product_changes" ON product_changes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete product_changes" ON product_changes FOR DELETE TO anon USING (true);

-- news_articles
CREATE POLICY "Allow public read news_articles" ON news_articles FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert news_articles" ON news_articles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update news_articles" ON news_articles FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete news_articles" ON news_articles FOR DELETE TO anon USING (true);

-- swot_analyses
CREATE POLICY "Allow public read swot_analyses" ON swot_analyses FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert swot_analyses" ON swot_analyses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update swot_analyses" ON swot_analyses FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete swot_analyses" ON swot_analyses FOR DELETE TO anon USING (true);

-- market_shifts
CREATE POLICY "Allow public read market_shifts" ON market_shifts FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert market_shifts" ON market_shifts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update market_shifts" ON market_shifts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete market_shifts" ON market_shifts FOR DELETE TO anon USING (true);

-- alerts
CREATE POLICY "Allow public read alerts" ON alerts FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert alerts" ON alerts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update alerts" ON alerts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete alerts" ON alerts FOR DELETE TO anon USING (true);

-- executive_reports
CREATE POLICY "Allow public read executive_reports" ON executive_reports FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert executive_reports" ON executive_reports FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update executive_reports" ON executive_reports FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete executive_reports" ON executive_reports FOR DELETE TO anon USING (true);

-- anomaly_detections
CREATE POLICY "Allow public read anomaly_detections" ON anomaly_detections FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert anomaly_detections" ON anomaly_detections FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update anomaly_detections" ON anomaly_detections FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete anomaly_detections" ON anomaly_detections FOR DELETE TO anon USING (true);

-- agent_execution_logs
CREATE POLICY "Allow public read agent_execution_logs" ON agent_execution_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert agent_execution_logs" ON agent_execution_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update agent_execution_logs" ON agent_execution_logs FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete agent_execution_logs" ON agent_execution_logs FOR DELETE TO anon USING (true);

-- Insert sample competitors for testing
INSERT INTO competitors (name, industry, website, description, status) VALUES
  ('Apple', 'Technology', 'https://apple.com', 'Consumer electronics and software company', 'active'),
  ('Microsoft', 'Technology', 'https://microsoft.com', 'Software and cloud computing company', 'active'),
  ('Google', 'Technology', 'https://google.com', 'Search and advertising technology company', 'active'),
  ('Amazon', 'E-commerce', 'https://amazon.com', 'E-commerce and cloud computing company', 'active'),
  ('Tesla', 'Automotive', 'https://tesla.com', 'Electric vehicles and clean energy company', 'active');

-- Insert sample news articles
INSERT INTO news_articles (competitor_id, title, content, summary, source, url, sentiment_score, published_at)
SELECT 
  c.id,
  'Sample news article about ' || c.name,
  'This is sample content about ' || c.name || ' for testing purposes.',
  'Brief summary about ' || c.name,
  'TechNews',
  'https://example.com/news/' || lower(c.name),
  (random() * 2 - 1)::numeric(3,2),
  now() - (random() * interval '7 days')
FROM competitors c;
