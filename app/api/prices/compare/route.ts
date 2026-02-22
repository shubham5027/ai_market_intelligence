import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// GET price comparison across competitors for same/similar products
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const productName = searchParams.get('product_name');
    const industry = searchParams.get('industry');

    // Get latest price for each competitor-product combination
    let query = supabase
      .from('price_monitoring')
      .select(`
        id,
        competitor_id,
        product_name,
        price,
        currency,
        change_percentage,
        detected_at,
        competitors (
          id,
          name,
          industry
        )
      `)
      .order('detected_at', { ascending: false });

    if (productName) {
      query = query.ilike('product_name', `%${productName}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by product and get latest price per competitor
    const comparison = groupAndCompare(data || [], industry);

    return NextResponse.json({ comparison });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function groupAndCompare(prices: any[], industryFilter?: string | null) {
  // Filter by industry if specified
  let filteredPrices = prices;
  if (industryFilter) {
    filteredPrices = prices.filter(
      p => p.competitors?.industry?.toLowerCase() === industryFilter.toLowerCase()
    );
  }

  // Group by product name
  const productGroups: Record<string, any[]> = {};
  
  for (const price of filteredPrices) {
    const productKey = price.product_name.toLowerCase();
    if (!productGroups[productKey]) {
      productGroups[productKey] = [];
    }
    
    // Only keep latest price per competitor for each product
    const existingIdx = productGroups[productKey].findIndex(
      p => p.competitor_id === price.competitor_id
    );
    
    if (existingIdx === -1) {
      productGroups[productKey].push(price);
    }
  }

  // Calculate comparison stats for each product
  const result = Object.entries(productGroups).map(([productName, competitors]) => {
    const priceValues = competitors.map(c => c.price);
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);
    const avgPrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;

    return {
      product_name: productName,
      competitor_count: competitors.length,
      min_price: minPrice,
      max_price: maxPrice,
      avg_price: Math.round(avgPrice * 100) / 100,
      price_spread: Math.round((maxPrice - minPrice) * 100) / 100,
      price_spread_percent: minPrice > 0 ? Math.round(((maxPrice - minPrice) / minPrice) * 100 * 100) / 100 : 0,
      competitors: competitors.map(c => ({
        competitor_id: c.competitor_id,
        competitor_name: c.competitors?.name,
        price: c.price,
        currency: c.currency,
        change_percentage: c.change_percentage,
        detected_at: c.detected_at,
        is_lowest: c.price === minPrice,
        is_highest: c.price === maxPrice,
        diff_from_avg: Math.round((c.price - avgPrice) * 100) / 100,
        diff_from_avg_percent: avgPrice > 0 ? Math.round(((c.price - avgPrice) / avgPrice) * 100 * 100) / 100 : 0,
      })),
    };
  });

  return result.sort((a, b) => b.competitor_count - a.competitor_count);
}
