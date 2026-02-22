import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// Calculate stats from product changes
function calculateStats(changes: any[]) {
  const newFeatures = changes.filter(c => c.change_type === 'new_feature' || c.change_type === 'feature').length;
  const newProducts = changes.filter(c => c.change_type === 'new_product' || c.change_type === 'product_launch').length;
  const updates = changes.filter(c => c.change_type === 'update' || c.change_type === 'enhancement').length;
  const highImpact = changes.filter(c => {
    const impact = c.after_state?.impact || c.metadata?.impact;
    return impact === 'high' || impact === 'critical';
  }).length;

  return {
    totalCount: changes.length,
    newFeatures,
    newProducts,
    updates,
    highImpact,
    bugFixes: changes.filter(c => c.change_type === 'bug_fix' || c.change_type === 'fix').length,
  };
}

// GET all product changes
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        changes: [],
        stats: { totalCount: 0, newFeatures: 0, newProducts: 0, updates: 0, highImpact: 0, bugFixes: 0 },
      });
    }
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const competitorId = searchParams.get('competitor_id');
    const changeType = searchParams.get('type');
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '50');

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('product_changes')
      .select(`
        *,
        competitors (
          id,
          name,
          industry
        )
      `)
      .gte('detected_at', startDate)
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (competitorId) {
      query = query.eq('competitor_id', competitorId);
    }
    if (changeType) {
      query = query.eq('change_type', changeType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching product changes:', error);
      return NextResponse.json({
        changes: [],
        stats: { totalCount: 0, newFeatures: 0, newProducts: 0, updates: 0, highImpact: 0, bugFixes: 0 },
        error: error.message,
      });
    }

    const stats = calculateStats(data || []);
    return NextResponse.json({ changes: data || [], stats });
  } catch (error: any) {
    console.error('Error in product-changes GET:', error);
    return NextResponse.json({
      changes: [],
      stats: { totalCount: 0, newFeatures: 0, newProducts: 0, updates: 0, highImpact: 0, bugFixes: 0 },
      error: error.message,
    });
  }
}

// POST - Create product change or run detection
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }
    const supabase = getSupabase();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'run-detection': {
        // Import and run the product change agent
        const { ProductChangeAgent } = await import('@/lib/agents/product-change-agent');
        const agent = new ProductChangeAgent();
        const result = await agent.execute({
          competitorId: body.competitorId,
          parameters: body.parameters || {},
          timestamp: new Date(),
        });
        return NextResponse.json({
          success: result.success,
          metadata: result.metadata,
          changes: result.data,
        });
      }

      case 'add': {
        const { competitor_id, change_type, product_name, description, impact } = body;
        if (!competitor_id || !change_type || !product_name) {
          return NextResponse.json(
            { error: 'competitor_id, change_type, and product_name are required' },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .from('product_changes')
          .insert({
            competitor_id,
            change_type,
            product_name,
            description,
            after_state: { impact: impact || 'medium' },
            confidence_score: 1.0, // Manual entry
            detected_at: new Date().toISOString(),
          })
          .select(`
            *,
            competitors (id, name, industry)
          `)
          .single();

        if (error) throw error;

        // Create alert for high impact changes
        if (impact === 'high' || impact === 'critical') {
          await supabase.from('alerts').insert({
            alert_type: 'product_change',
            title: `High Impact Product Change - ${data.competitors?.name || 'Unknown'}`,
            message: `${product_name}: ${description || change_type}`,
            severity: impact === 'critical' ? 'critical' : 'warning',
            related_entity_type: 'product_changes',
            related_entity_id: data.id,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }

        return NextResponse.json({ success: true, change: data });
      }

      case 'delete': {
        const { changeId } = body;
        if (!changeId) {
          return NextResponse.json({ error: 'changeId is required' }, { status: 400 });
        }
        const { error } = await supabase
          .from('product_changes')
          .delete()
          .eq('id', changeId);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in product-changes POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
