import { NextRequest, NextResponse } from 'next/server';
import { MarketShiftAgent } from '@/lib/agents/market-shift-agent';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { tavilySearch, tavilyResearch } from '@/lib/tavily-agent';

// GET /api/market-shifts - Fetch market shifts from database
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        shifts: [], 
        stats: getDefaultStats(),
        message: 'Database not configured' 
      });
    }

    const supabase = getSupabase();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const shiftType = searchParams.get('type');
    const severity = searchParams.get('severity');
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('market_shifts')
      .select('*')
      .gte('detected_at', startDate)
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (shiftType) {
      query = query.eq('shift_type', shiftType);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: shifts, error } = await query;

    if (error) {
      console.error('Error fetching market shifts:', error);
      return NextResponse.json({ shifts: [], stats: getDefaultStats(), error: error.message });
    }

    const stats = calculateStats(shifts || []);

    return NextResponse.json({ shifts: shifts || [], stats });
  } catch (error: any) {
    console.error('Market Shifts API Error:', error);
    return NextResponse.json(
      { error: error.message, shifts: [], stats: getDefaultStats() },
      { status: 500 }
    );
  }
}

// POST /api/market-shifts - Run market shift detection or research
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, industry, topics, topic, manualShift } = body;

    // Action: run-agent - Run the MarketShiftAgent
    if (action === 'run-agent') {
      const agent = new MarketShiftAgent();
      const result = await agent.execute({
        timestamp: new Date(),
        parameters: { industry, topics },
      });

      return NextResponse.json({
        success: result.success,
        data: result.data,
        metadata: result.metadata,
        error: result.error,
      });
    }

    // Action: research - Use Tavily to research market trends
    if (action === 'research') {
      const searchTopic = topic || industry + ' market trends 2026' || 'technology market trends 2026';
      const research = await tavilyResearch(searchTopic);
      
      return NextResponse.json({
        success: true,
        action: 'research',
        data: research,
      });
    }

    // Action: scan - Quick scan for market news using Tavily
    if (action === 'scan') {
      const queries = topics || [
        (industry || 'SaaS') + ' market trends 2026',
        (industry || 'technology') + ' industry shifts',
        'emerging technology market outlook',
      ];

      const results = await Promise.all(
        queries.slice(0, 3).map((q: string) => tavilySearch(q, { maxResults: 5, includeAnswer: true }))
      );

      const allResults = results.flatMap((r) => r.results || []);
      const answers = results.map(r => r.answer).filter(Boolean);

      return NextResponse.json({
        success: true,
        action: 'scan',
        data: {
          queries,
          totalResults: allResults.length,
          answers,
          results: allResults,
        },
      });
    }

    // Action: add-manual - Add a manual market shift entry
    if (action === 'add-manual' && manualShift) {
      if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 400 });
      }

      const supabase = getSupabase();
      const { data, error } = await supabase.from('market_shifts').insert({
        shift_type: manualShift.type || 'market_trend',
        description: manualShift.description,
        severity: manualShift.severity || 'medium',
        impact_level: manualShift.impact || 'medium',
        affected_competitors: manualShift.affectedCompetitors || [],
        indicators: manualShift.indicators || {},
        confidence_score: manualShift.confidenceScore || 0.7,
        detected_at: new Date().toISOString(),
      }).select().single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, shift: data });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: run-agent, research, scan, or add-manual' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Market Shifts POST Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateStats(shifts: any[]): Record<string, any> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const currentPeriod = shifts.filter(
    (s) => new Date(s.detected_at) >= thirtyDaysAgo
  );
  
  const previousPeriod = shifts.filter(
    (s) => new Date(s.detected_at) >= sixtyDaysAgo && new Date(s.detected_at) < thirtyDaysAgo
  );

  const byType = currentPeriod.reduce((acc: Record<string, number>, s) => {
    acc[s.shift_type] = (acc[s.shift_type] || 0) + 1;
    return acc;
  }, {});

  const bySeverity = currentPeriod.reduce((acc: Record<string, number>, s) => {
    acc[s.severity] = (acc[s.severity] || 0) + 1;
    return acc;
  }, {});

  const avgConfidence = currentPeriod.length > 0
    ? currentPeriod.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / currentPeriod.length
    : 0;

  const trend = currentPeriod.length > previousPeriod.length ? 'increasing' 
    : currentPeriod.length < previousPeriod.length ? 'decreasing' 
    : 'stable';

  return {
    totalShifts: currentPeriod.length,
    previousPeriodShifts: previousPeriod.length,
    trend,
    changePercent: previousPeriod.length > 0 
      ? ((currentPeriod.length - previousPeriod.length) / previousPeriod.length * 100).toFixed(1)
      : '0',
    byType,
    bySeverity,
    criticalCount: bySeverity.critical || 0,
    highCount: bySeverity.high || 0,
    averageConfidence: avgConfidence.toFixed(2),
  };
}

function getDefaultStats(): Record<string, any> {
  return {
    totalShifts: 0,
    previousPeriodShifts: 0,
    trend: 'stable',
    changePercent: '0',
    byType: {},
    bySeverity: {},
    criticalCount: 0,
    highCount: 0,
    averageConfidence: '0',
  };
}
