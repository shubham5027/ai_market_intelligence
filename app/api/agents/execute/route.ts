import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents/orchestrator';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agents, competitorId, parallel = true, parameters } = body;

    if (!agents || !Array.isArray(agents) || agents.length === 0) {
      return NextResponse.json(
        { error: 'Agents array is required' },
        { status: 400 }
      );
    }

    const availableAgents = orchestrator.getAvailableAgents();
    const invalidAgents = agents.filter((a) => !availableAgents.includes(a));

    if (invalidAgents.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid agents: ${invalidAgents.join(', ')}`,
          availableAgents,
        },
        { status: 400 }
      );
    }

    const result = await orchestrator.executeAgents({
      agents,
      competitorId,
      parallel,
      parameters,
    });

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
