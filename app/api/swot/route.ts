import { NextRequest, NextResponse } from 'next/server';
import { SWOTAnalysisAgent, SWOTAnalysisResult } from '@/lib/agents/swot-analysis-agent';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// POST /api/swot - Run SWOT analysis for a competitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { competitorId, companyContext } = body;

    if (!competitorId) {
      return NextResponse.json(
        { error: 'competitorId is required' },
        { status: 400 }
      );
    }

    const agent = new SWOTAnalysisAgent();
    const result = await agent.execute({
      competitorId,
      companyContext,
      timestamp: new Date(),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'SWOT analysis failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data as SWOTAnalysisResult,
      metadata: result.metadata,
      confidence: result.confidence,
    });
  } catch (error: any) {
    console.error('SWOT API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/swot - Get historical SWOT analyses
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ analyses: [], message: 'Database not configured' });
    }

    const supabase = getSupabase();
    const searchParams = request.nextUrl.searchParams;
    const competitorId = searchParams.get('competitorId');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('swot_analyses')
      .select(`
        *,
        competitors (id, name, industry, website)
      `)
      .order('analyzed_at', { ascending: false })
      .limit(limit);

    if (competitorId) {
      query = query.eq('competitor_id', competitorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching SWOT analyses:', error);
      return NextResponse.json({ analyses: [], error: error.message });
    }

    // Transform data to include computed fields
    const analyses = (data || []).map((analysis: any) => ({
      ...analysis,
      // Compute high-impact counts
      highImpactStrengths: (analysis.strengths || []).filter((s: any) => s.impact_score >= 70).length,
      highImpactThreats: (analysis.threats || []).filter((t: any) => t.impact_score >= 70).length,
      // Average confidence across all insights
      averageConfidence: calculateAverageConfidence(analysis),
    }));

    return NextResponse.json({ analyses });
  } catch (error: any) {
    console.error('SWOT API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', analyses: [] },
      { status: 500 }
    );
  }
}

function calculateAverageConfidence(analysis: any): number {
  const allInsights = [
    ...(analysis.strengths || []),
    ...(analysis.weaknesses || []),
    ...(analysis.opportunities || []),
    ...(analysis.threats || []),
  ];
  
  if (allInsights.length === 0) return 0;
  
  const totalConfidence = allInsights.reduce(
    (sum: number, insight: any) => sum + (insight.confidence_score || 0),
    0
  );
  
  return totalConfidence / allInsights.length;
}
