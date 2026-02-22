import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// GET all price monitoring records
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.' },
        { status: 503 }
      );
    }
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const competitorId = searchParams.get('competitor_id');
    const limit = searchParams.get('limit');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('price_monitoring')
      .select(`
        *,
        competitors (
          id,
          name,
          industry
        )
      `);

    // Filter by competitor if provided
    if (competitorId) {
      query = query.eq('competitor_id', competitorId);
    }

    // Filter by date range
    if (startDate) {
      query = query.gte('detected_at', startDate);
    }
    if (endDate) {
      query = query.lte('detected_at', endDate);
    }

    // Order by most recent
    query = query.order('detected_at', { ascending: false });

    // Limit results if specified
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate statistics
    const stats = calculatePriceStats(data || []);

    return NextResponse.json({ 
      prices: data,
      stats 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new price monitoring record
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }
    const supabase = getSupabase();
    const body = await request.json();
    const { 
      competitor_id, 
      product_name, 
      product_sku, 
      price, 
      currency = 'USD',
      url,
      change_percentage,
      metadata 
    } = body;

    // Validation
    if (!competitor_id || !product_name || price === undefined) {
      return NextResponse.json(
        { error: 'competitor_id, product_name, and price are required' },
        { status: 400 }
      );
    }

    // Calculate change percentage if not provided
    let calculatedChangePercentage = change_percentage;
    if (calculatedChangePercentage === undefined) {
      // Get the previous price for this product
      const { data: previousPrice } = await supabase
        .from('price_monitoring')
        .select('price')
        .eq('competitor_id', competitor_id)
        .eq('product_name', product_name)
        .order('detected_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (previousPrice) {
        calculatedChangePercentage = ((price - previousPrice.price) / previousPrice.price) * 100;
      } else {
        calculatedChangePercentage = 0;
      }
    }

    const { data, error } = await supabase
      .from('price_monitoring')
      .insert({
        competitor_id,
        product_name,
        product_sku,
        price,
        currency,
        url,
        change_percentage: calculatedChangePercentage,
        metadata: metadata || {},
        detected_at: new Date().toISOString(),
      })
      .select(`
        *,
        competitors (
          id,
          name,
          industry
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create alert if significant price change detected
    if (Math.abs(calculatedChangePercentage) >= 10) {
      await createPriceAlert(data, calculatedChangePercentage);
    }

    return NextResponse.json({ price: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to calculate price statistics
function calculatePriceStats(prices: any[]) {
  if (!prices.length) {
    return {
      totalRecords: 0,
      priceIncreases: 0,
      priceDecreases: 0,
      avgChangePercentage: 0,
      significantChanges: 0,
    };
  }

  const priceIncreases = prices.filter(p => (p.change_percentage || 0) > 0).length;
  const priceDecreases = prices.filter(p => (p.change_percentage || 0) < 0).length;
  const significantChanges = prices.filter(p => Math.abs(p.change_percentage || 0) >= 10).length;
  
  const totalChange = prices.reduce((sum, p) => sum + (p.change_percentage || 0), 0);
  const avgChangePercentage = prices.length > 0 ? totalChange / prices.length : 0;

  return {
    totalRecords: prices.length,
    priceIncreases,
    priceDecreases,
    avgChangePercentage: Math.round(avgChangePercentage * 100) / 100,
    significantChanges,
  };
}

// Helper function to create price alert
async function createPriceAlert(priceData: any, changePercentage: number) {
  const supabase = getSupabase();
  const severity = Math.abs(changePercentage) >= 20 ? 'critical' : 'warning';
  const direction = changePercentage > 0 ? 'increased' : 'decreased';

  await supabase.from('alerts').insert({
    alert_type: 'price_change',
    title: `Significant Price Change - ${priceData.competitors?.name || 'Unknown'}`,
    message: `${priceData.product_name} ${direction} by ${Math.abs(changePercentage).toFixed(1)}%`,
    severity,
    related_entity_type: 'price_monitoring',
    related_entity_id: priceData.id,
    metadata: {
      competitor_id: priceData.competitor_id,
      product_name: priceData.product_name,
      old_price: priceData.price / (1 + changePercentage / 100),
      new_price: priceData.price,
      change_percentage: changePercentage,
    },
    is_read: false,
    created_at: new Date().toISOString(),
  });
}
