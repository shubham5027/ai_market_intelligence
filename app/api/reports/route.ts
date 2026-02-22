import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// Report type mappings
const REPORT_TYPES: Record<string, { name: string; description: string; agent?: string }> = {
  executive: { 
    name: 'Executive Summary', 
    description: 'High-level overview for leadership',
    agent: 'executive_report'
  },
  weekly: { 
    name: 'Weekly Digest', 
    description: 'Regular competitive updates',
    agent: 'news_aggregation'
  },
  swot: { 
    name: 'SWOT Analysis', 
    description: 'Strategic strengths and weaknesses analysis',
    agent: 'swot_analysis'
  },
  market: { 
    name: 'Market Trends', 
    description: 'Industry and market analysis',
    agent: 'market_shift'
  },
  pricing: { 
    name: 'Pricing Analysis', 
    description: 'Competitor pricing strategies',
    agent: 'price_monitoring'
  },
};

// Calculate stats from reports
function calculateStats(reports: any[]) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const thisMonth = reports.filter(r => new Date(r.generated_at) >= monthStart);
  const generating = reports.filter(r => r.status === 'generating');
  const scheduled = reports.filter(r => r.status === 'scheduled');
  
  return {
    total: reports.length,
    thisMonth: thisMonth.length,
    generating: generating.length,
    scheduled: scheduled.length,
    ready: reports.filter(r => r.status === 'ready' || !r.status).length,
  };
}

// GET all reports
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        reports: [],
        stats: { total: 0, thisMonth: 0, generating: 0, scheduled: 0, ready: 0 },
        templates: Object.entries(REPORT_TYPES).map(([key, value]) => ({
          id: key,
          ...value,
        })),
      });
    }
    
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const reportType = searchParams.get('type');
    const status = searchParams.get('status');

    let query = supabase
      .from('executive_reports')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (reportType) {
      query = query.eq('report_period', reportType);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({
        reports: [],
        stats: { total: 0, thisMonth: 0, generating: 0, scheduled: 0, ready: 0 },
        templates: Object.entries(REPORT_TYPES).map(([key, value]) => ({
          id: key,
          ...value,
        })),
        error: error.message,
      });
    }

    // Transform reports to include proper status and title
    const transformedReports = (data || []).map(report => ({
      ...report,
      title: report.title || generateReportTitle(report),
      status: report.status || 'ready',
      type: REPORT_TYPES[report.report_period]?.name || report.report_period,
      pages: report.metrics?.pages || estimatePages(report),
    }));

    const stats = calculateStats(transformedReports);
    
    return NextResponse.json({ 
      reports: transformedReports, 
      stats,
      templates: Object.entries(REPORT_TYPES).map(([key, value]) => ({
        id: key,
        ...value,
      })),
    });
  } catch (error: any) {
    console.error('Error in reports GET:', error);
    return NextResponse.json({
      reports: [],
      stats: { total: 0, thisMonth: 0, generating: 0, scheduled: 0, ready: 0 },
      templates: [],
      error: error.message,
    });
  }
}

// Helper functions
function generateReportTitle(report: any): string {
  const period = report.report_period || 'executive';
  const date = new Date(report.generated_at);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  switch (period) {
    case 'executive':
      return `Executive Summary - ${dateStr}`;
    case 'weekly':
      return `Weekly Intelligence Digest - ${dateStr}`;
    case 'swot':
      return `SWOT Analysis Report - ${dateStr}`;
    case 'market':
      return `Market Trends Report - ${dateStr}`;
    case 'pricing':
      return `Pricing Strategy Analysis - ${dateStr}`;
    default:
      return `Intelligence Report - ${dateStr}`;
  }
}

function estimatePages(report: any): number {
  const summaryLength = (report.summary || '').length;
  const insightsCount = Array.isArray(report.key_insights) ? report.key_insights.length : 0;
  const recommendationsCount = Array.isArray(report.recommendations) ? report.recommendations.length : 0;
  
  // Estimate pages based on content
  const contentScore = Math.ceil(summaryLength / 2000) + Math.ceil(insightsCount / 5) + Math.ceil(recommendationsCount / 3);
  return Math.max(1, Math.min(contentScore, 50));
}

// POST - Create report or perform actions
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }
    
    const supabase = getSupabase();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'generate': {
        const { type = 'executive', competitorId, parameters = {} } = body;
        
        // Import the appropriate agent
        let agent;
        let result;
        
        switch (type) {
          case 'executive':
          case 'weekly': {
            const { ExecutiveReportAgent } = await import('@/lib/agents/executive-report-agent');
            agent = new ExecutiveReportAgent();
            result = await agent.execute({
              timestamp: new Date(),
              parameters: { period: type, ...parameters },
            });
            break;
          }
          case 'swot': {
            const { SWOTAnalysisAgent } = await import('@/lib/agents/swot-analysis-agent');
            agent = new SWOTAnalysisAgent();
            result = await agent.execute({
              competitorId,
              timestamp: new Date(),
              parameters,
            });
            break;
          }
          case 'market': {
            const { MarketShiftAgent } = await import('@/lib/agents/market-shift-agent');
            agent = new MarketShiftAgent();
            result = await agent.execute({
              timestamp: new Date(),
              parameters,
            });
            break;
          }
          case 'pricing': {
            const { PriceMonitoringAgent } = await import('@/lib/agents/price-monitoring-agent');
            agent = new PriceMonitoringAgent();
            result = await agent.execute({
              competitorId,
              timestamp: new Date(),
              parameters,
            });
            break;
          }
          default:
            return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }

        if (!result.success) {
          throw new Error(result.error || 'Report generation failed');
        }

        return NextResponse.json({
          success: true,
          report: result.data,
          confidence: result.confidence,
          metadata: result.metadata,
        });
      }

      case 'delete': {
        const { reportId } = body;
        if (!reportId) {
          return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
        }
        
        const { error } = await supabase
          .from('executive_reports')
          .delete()
          .eq('id', reportId);
          
        if (error) throw error;
        
        return NextResponse.json({ success: true });
      }

      case 'schedule': {
        const { type, scheduledFor, parameters = {} } = body;
        
        // Insert a scheduled report record
        const { data, error } = await supabase
          .from('executive_reports')
          .insert({
            report_period: type,
            summary: '',
            status: 'scheduled',
            metrics: { scheduled_for: scheduledFor, parameters },
            generated_at: new Date().toISOString(),
          })
          .select()
          .single();
          
        if (error) throw error;
        
        return NextResponse.json({ success: true, report: data });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in reports POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
