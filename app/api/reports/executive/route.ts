import { NextRequest, NextResponse } from 'next/server';
import { ExecutiveReportAgent } from '@/lib/agents/executive-report-agent';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data, error } = await supabase
      .from('executive_reports')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { period = 'weekly' } = body;

    const agent = new ExecutiveReportAgent();
    const result = await agent.execute({
      timestamp: new Date(),
      parameters: { period },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report: result.data,
      confidence: result.confidence,
      metadata: result.metadata,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
