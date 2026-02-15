import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents/orchestrator';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const result = await orchestrator.executeMarketAnalysis();

    return NextResponse.json({
      success: result.success,
      results: result.results,
      summary: result.summary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
