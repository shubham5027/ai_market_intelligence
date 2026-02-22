import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// Calculate stats from alerts
function calculateStats(alerts: any[]) {
  const unreadCount = alerts.filter(a => !a.is_read).length;
  const highPriorityCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length;
  const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekCount = alerts.filter(a => new Date(a.created_at) >= thisWeek).length;
  
  // Count by type for "active rules"
  const types = new Set(alerts.map(a => a.alert_type));
  
  return {
    unreadCount,
    highPriorityCount,
    thisWeekCount,
    activeRulesCount: types.size,
    totalCount: alerts.length,
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        alerts: [], 
        stats: { unreadCount: 0, highPriorityCount: 0, thisWeekCount: 0, activeRulesCount: 0, totalCount: 0 } 
      });
    }
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const alertType = searchParams.get('type');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }
    if (alertType) {
      query = query.eq('alert_type', alertType);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching alerts:', error);
      return NextResponse.json({ 
        alerts: [], 
        stats: { unreadCount: 0, highPriorityCount: 0, thisWeekCount: 0, activeRulesCount: 0, totalCount: 0 },
        error: error.message 
      });
    }

    const stats = calculateStats(data || []);
    return NextResponse.json({ alerts: data || [], stats });
  } catch (error: any) {
    console.error('Error in alerts GET:', error);
    return NextResponse.json({ 
      alerts: [], 
      stats: { unreadCount: 0, highPriorityCount: 0, thisWeekCount: 0, activeRulesCount: 0, totalCount: 0 },
      error: error.message 
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }
    const supabase = getSupabase();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'mark-read': {
        const { alertId } = body;
        if (!alertId) {
          return NextResponse.json({ error: 'alertId is required' }, { status: 400 });
        }
        const { error } = await supabase
          .from('alerts')
          .update({ is_read: true })
          .eq('id', alertId);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case 'mark-unread': {
        const { alertId } = body;
        if (!alertId) {
          return NextResponse.json({ error: 'alertId is required' }, { status: 400 });
        }
        const { error } = await supabase
          .from('alerts')
          .update({ is_read: false })
          .eq('id', alertId);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case 'mark-all-read': {
        const { error } = await supabase
          .from('alerts')
          .update({ is_read: true })
          .eq('is_read', false);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case 'delete': {
        const { alertId } = body;
        if (!alertId) {
          return NextResponse.json({ error: 'alertId is required' }, { status: 400 });
        }
        const { error } = await supabase
          .from('alerts')
          .delete()
          .eq('id', alertId);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case 'bulk-delete': {
        const { alertIds } = body;
        if (!alertIds || !Array.isArray(alertIds)) {
          return NextResponse.json({ error: 'alertIds array is required' }, { status: 400 });
        }
        const { error } = await supabase
          .from('alerts')
          .delete()
          .in('id', alertIds);
        if (error) throw error;
        return NextResponse.json({ success: true, deleted: alertIds.length });
      }

      case 'create': {
        const { alert_type, title, message, severity, related_entity_type, related_entity_id, metadata } = body;
        if (!alert_type || !title || !message) {
          return NextResponse.json({ error: 'alert_type, title, and message are required' }, { status: 400 });
        }
        const { data, error } = await supabase
          .from('alerts')
          .insert({
            alert_type,
            title,
            message,
            severity: severity || 'info',
            related_entity_type,
            related_entity_id,
            metadata: metadata || {},
            is_read: false,
          })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json({ success: true, alert: data });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in alerts POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }
    const supabase = getSupabase();
    const body = await request.json();
    const { alertIds, isRead } = body;

    if (!alertIds || !Array.isArray(alertIds)) {
      return NextResponse.json(
        { error: 'alertIds array is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('alerts')
      .update({ is_read: isRead })
      .in('id', alertIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: alertIds.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
