import { NextRequest, NextResponse } from 'next/server';
import { AnomalyDetectionAgent } from '@/lib/agents/anomaly-detection-agent';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// GET /api/anomalies - Fetch anomalies from database
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        anomalies: [], 
        stats: getDefaultStats(),
        message: 'Database not configured' 
      });
    }

    const supabase = getSupabase();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const severity = searchParams.get('severity');
    const anomalyType = searchParams.get('type');
    const status = searchParams.get('status');
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('anomaly_detections')
      .select(`
        *,
        competitors:affected_entity_id (id, name)
      `)
      .gte('detected_at', startDate)
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (severity) {
      query = query.eq('severity', severity);
    }
    if (anomalyType) {
      query = query.eq('anomaly_type', anomalyType);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: anomalies, error } = await query;

    if (error) {
      console.error('Error fetching anomalies:', error);
      return NextResponse.json({ anomalies: [], stats: getDefaultStats(), error: error.message });
    }

    const stats = calculateStats(anomalies || []);

    return NextResponse.json({ anomalies: anomalies || [], stats });
  } catch (error: any) {
    console.error('Anomalies API Error:', error);
    return NextResponse.json(
      { error: error.message, anomalies: [], stats: getDefaultStats() },
      { status: 500 }
    );
  }
}

// POST /api/anomalies - Run detection or update status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, anomalyId, status, competitorId } = body;

    // Action: run-detection - Run the AnomalyDetectionAgent
    if (action === 'run-detection') {
      const agent = new AnomalyDetectionAgent();
      const result = await agent.execute({
        timestamp: new Date(),
        competitorId,
      });

      return NextResponse.json({
        success: result.success,
        data: result.data,
        metadata: result.metadata,
        error: result.error,
      });
    }

    // Action: update-status - Update anomaly status
    if (action === 'update-status' && anomalyId) {
      if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 400 });
      }

      const supabase = getSupabase();
      const validStatuses = ['new', 'investigating', 'acknowledged', 'resolved', 'dismissed'];
      
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('anomaly_detections')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', anomalyId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, anomaly: data });
    }

    // Action: dismiss - Dismiss an anomaly
    if (action === 'dismiss' && anomalyId) {
      if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 400 });
      }

      const supabase = getSupabase();
      const { error } = await supabase
        .from('anomaly_detections')
        .update({ 
          status: 'dismissed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', anomalyId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Action: bulk-update - Update multiple anomalies
    if (action === 'bulk-update' && body.anomalyIds && status) {
      if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 400 });
      }

      const supabase = getSupabase();
      const { error } = await supabase
        .from('anomaly_detections')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .in('id', body.anomalyIds);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, updated: body.anomalyIds.length });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: run-detection, update-status, dismiss, or bulk-update' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Anomalies POST Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateStats(anomalies: any[]): Record<string, any> {
  const bySeverity = anomalies.reduce((acc: Record<string, number>, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {});

  const byStatus = anomalies.reduce((acc: Record<string, number>, a) => {
    const status = a.status || 'new';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const byType = anomalies.reduce((acc: Record<string, number>, a) => {
    acc[a.anomaly_type] = (acc[a.anomaly_type] || 0) + 1;
    return acc;
  }, {});

  const highConfidence = anomalies.filter(a => a.confidence_score > 0.85).length;
  const avgConfidence = anomalies.length > 0
    ? anomalies.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / anomalies.length
    : 0;

  // Calculate risk level
  const criticalCount = bySeverity.critical || 0;
  const highCount = bySeverity.high || 0;
  let riskLevel = 'low';
  if (criticalCount > 0) riskLevel = 'critical';
  else if (highCount >= 3) riskLevel = 'high';
  else if (highCount > 0 || (bySeverity.medium || 0) >= 5) riskLevel = 'medium';

  return {
    total: anomalies.length,
    bySeverity,
    byStatus,
    byType,
    criticalCount,
    highCount,
    mediumCount: bySeverity.medium || 0,
    lowCount: bySeverity.low || 0,
    newCount: byStatus.new || 0,
    investigatingCount: byStatus.investigating || 0,
    resolvedCount: byStatus.resolved || 0,
    highConfidence,
    avgConfidence: avgConfidence.toFixed(2),
    riskLevel,
  };
}

function getDefaultStats(): Record<string, any> {
  return {
    total: 0,
    bySeverity: {},
    byStatus: {},
    byType: {},
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    newCount: 0,
    investigatingCount: 0,
    resolvedCount: 0,
    highConfidence: 0,
    avgConfidence: '0',
    riskLevel: 'low',
  };
}
