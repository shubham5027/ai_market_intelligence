/*
  # Competitive Intelligence System Schema

  ## Overview
  Database schema for a multi-agent competitive intelligence platform that tracks competitors,
  monitors pricing, detects product changes, aggregates news, and generates insights.

  ## Tables Created

  ### 1. competitors
  Stores information about tracked competitors
  - `id` (uuid, primary key)
  - `name` (text) - Company name
  - `industry` (text) - Industry sector
  - `website` (text) - Company website URL
  - `description` (text) - Company description
  - `status` (text) - Monitoring status (active, paused, archived)
  - `metadata` (jsonb) - Additional flexible data
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. price_monitoring
  Tracks competitor pricing changes over time
  - `id` (uuid, primary key)
  - `competitor_id` (uuid, foreign key)
  - `product_name` (text)
  - `product_sku` (text)
  - `price` (numeric)
  - `currency` (text)
  - `url` (text)
  - `change_percentage` (numeric)
  - `metadata` (jsonb)
  - `detected_at` (timestamptz)

  ### 3. product_changes
  Logs detected product changes (features, availability, etc.)
  - `id` (uuid, primary key)
  - `competitor_id` (uuid, foreign key)
  - `change_type` (text)
  - `product_name` (text)
  - `description` (text)
  - `before_state` (jsonb)
  - `after_state` (jsonb)
  - `confidence_score` (numeric)
  - `detected_at` (timestamptz)

  ### 4. news_articles
  Aggregates competitor-related news articles
  - `id` (uuid, primary key)
  - `competitor_id` (uuid, foreign key)
  - `title` (text)
  - `content` (text)
  - `summary` (text)
  - `source` (text)
  - `url` (text)
  - `sentiment_score` (numeric)
  - `published_at` (timestamptz)
  - `collected_at` (timestamptz)

  ### 5. swot_analyses
  Stores SWOT analysis results
  - `id` (uuid, primary key)
  - `competitor_id` (uuid, foreign key)
  - `strengths` (jsonb)
  - `weaknesses` (jsonb)
  - `opportunities` (jsonb)
  - `threats` (jsonb)
  - `overall_score` (numeric)
  - `confidence_score` (numeric)
  - `analyzed_at` (timestamptz)

  ### 6. market_shifts
  Tracks detected market shifts and trends
  - `id` (uuid, primary key)
  - `shift_type` (text)
  - `description` (text)
  - `severity` (text)
  - `affected_competitors` (jsonb)
  - `indicators` (jsonb)
  - `confidence_score` (numeric)
  - `detected_at` (timestamptz)

  ### 7. alerts
  Real-time alerts for significant events
  - `id` (uuid, primary key)
  - `alert_type` (text)
  - `title` (text)
  - `message` (text)
  - `severity` (text)
  - `related_entity_type` (text)
  - `related_entity_id` (uuid)
  - `metadata` (jsonb)
  - `is_read` (boolean)
  - `created_at` (timestamptz)

  ### 8. executive_reports
  Generated executive intelligence reports
  - `id` (uuid, primary key)
  - `report_period` (text)
  - `summary` (text)
  - `key_insights` (jsonb)
  - `recommendations` (jsonb)
  - `metrics` (jsonb)
  - `generated_by_model` (text)
  - `confidence_score` (numeric)
  - `generated_at` (timestamptz)

  ### 9. anomaly_detections
  Automated anomaly detection results
  - `id` (uuid, primary key)
  - `anomaly_type` (text)
  - `description` (text)
  - `affected_entity_type` (text)
  - `affected_entity_id` (uuid)
  - `severity` (text)
  - `confidence_score` (numeric)
  - `metrics` (jsonb)
  - `detected_at` (timestamptz)

  ### 10. agent_execution_logs
  Logs of multi-agent system executions
  - `id` (uuid, primary key)
  - `agent_name` (text)
  - `execution_type` (text)
  - `status` (text)
  - `input_data` (jsonb)
  - `output_data` (jsonb)
  - `duration_ms` (integer)
  - `error_message` (text)
  - `executed_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies restrict access to authenticated users only
*/

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

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can view competitors"
  ON competitors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert competitors"
  ON competitors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update competitors"
  ON competitors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete competitors"
  ON competitors FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view price monitoring"
  ON price_monitoring FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert price monitoring"
  ON price_monitoring FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view product changes"
  ON product_changes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert product changes"
  ON product_changes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view news articles"
  ON news_articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert news articles"
  ON news_articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view SWOT analyses"
  ON swot_analyses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert SWOT analyses"
  ON swot_analyses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view market shifts"
  ON market_shifts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert market shifts"
  ON market_shifts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view executive reports"
  ON executive_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert executive reports"
  ON executive_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view anomaly detections"
  ON anomaly_detections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert anomaly detections"
  ON anomaly_detections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view agent logs"
  ON agent_execution_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert agent logs"
  ON agent_execution_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);