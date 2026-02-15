import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      competitors,
      recentPricing,
      recentProducts,
      recentNews,
      recentAlerts,
      anomalies,
      marketShifts,
      latestReport,
    ] = await Promise.all([
      supabase.from('competitors').select('id, name, status').eq('status', 'active'),
      supabase
        .from('price_monitoring')
        .select('*')
        .gte('detected_at', last7Days)
        .order('detected_at', { ascending: false }),
      supabase
        .from('product_changes')
        .select('*')
        .gte('detected_at', last7Days)
        .order('detected_at', { ascending: false }),
      supabase
        .from('news_articles')
        .select('*')
        .gte('collected_at', last7Days)
        .order('collected_at', { ascending: false })
        .limit(20),
      supabase
        .from('alerts')
        .select('*')
        .gte('created_at', last24Hours)
        .order('created_at', { ascending: false }),
      supabase
        .from('anomaly_detections')
        .select('*')
        .gte('detected_at', last7Days)
        .order('detected_at', { ascending: false })
        .limit(10),
      supabase
        .from('market_shifts')
        .select('*')
        .gte('detected_at', last7Days)
        .order('detected_at', { ascending: false })
        .limit(5),
      supabase
        .from('executive_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const pricingData = recentPricing.data || [];
    const significantPriceChanges = pricingData.filter(
      (p) => Math.abs(p.change_percentage || 0) > 10
    ).length;

    const avgPriceChange =
      pricingData.length > 0
        ? pricingData.reduce((sum, p) => sum + (p.change_percentage || 0), 0) /
          pricingData.length
        : 0;

    const newsData = recentNews.data || [];
    const avgSentiment =
      newsData.length > 0
        ? newsData.reduce((sum, n) => sum + (n.sentiment_score || 0), 0) /
          newsData.length
        : 0;

    const overview = {
      competitors: {
        total: competitors.data?.length || 0,
        active: competitors.data?.filter((c) => c.status === 'active').length || 0,
      },
      pricing: {
        totalChanges: pricingData.length,
        significantChanges: significantPriceChanges,
        averageChange: parseFloat(avgPriceChange.toFixed(2)),
      },
      products: {
        totalChanges: recentProducts.data?.length || 0,
        newProducts:
          recentProducts.data?.filter((p) => p.change_type === 'new_product').length || 0,
        removedProducts:
          recentProducts.data?.filter((p) => p.change_type === 'removed_product').length || 0,
      },
      news: {
        totalArticles: newsData.length,
        averageSentiment: parseFloat(avgSentiment.toFixed(2)),
        sentimentTrend: avgSentiment > 0.3 ? 'positive' : avgSentiment < -0.3 ? 'negative' : 'neutral',
      },
      alerts: {
        total: recentAlerts.data?.length || 0,
        critical: recentAlerts.data?.filter((a) => a.severity === 'critical').length || 0,
        unread: recentAlerts.data?.filter((a) => !a.is_read).length || 0,
      },
      anomalies: {
        total: anomalies.data?.length || 0,
        highSeverity: anomalies.data?.filter((a) => a.severity === 'high' || a.severity === 'critical').length || 0,
      },
      marketShifts: {
        total: marketShifts.data?.length || 0,
        critical: marketShifts.data?.filter((m) => m.severity === 'critical').length || 0,
      },
      latestReport: latestReport.data,
    };

    return NextResponse.json({ overview });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
