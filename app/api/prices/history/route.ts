import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// GET price history for a specific product
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const competitorId = searchParams.get('competitor_id');
    const productName = searchParams.get('product_name');
    const days = parseInt(searchParams.get('days') || '30');

    if (!competitorId || !productName) {
      return NextResponse.json(
        { error: 'competitor_id and product_name are required' },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('price_monitoring')
      .select('*')
      .eq('competitor_id', competitorId)
      .eq('product_name', productName)
      .gte('detected_at', startDate.toISOString())
      .order('detected_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate trend data
    const trend = calculateTrend(data || []);

    return NextResponse.json({ 
      history: data,
      trend
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function calculateTrend(history: any[]) {
  if (history.length < 2) {
    return {
      direction: 'stable',
      changePercent: 0,
      minPrice: history[0]?.price || 0,
      maxPrice: history[0]?.price || 0,
      avgPrice: history[0]?.price || 0,
    };
  }

  const firstPrice = history[0].price;
  const lastPrice = history[history.length - 1].price;
  const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;

  const prices = history.map(h => h.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  return {
    direction: changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'stable',
    changePercent: Math.round(changePercent * 100) / 100,
    minPrice,
    maxPrice,
    avgPrice: Math.round(avgPrice * 100) / 100,
  };
}
