import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// GET all news articles
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
    const sentiment = searchParams.get('sentiment'); // positive, negative, neutral
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('news_articles')
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

    // Filter by sentiment
    if (sentiment === 'positive') {
      query = query.gt('sentiment_score', 0.3);
    } else if (sentiment === 'negative') {
      query = query.lt('sentiment_score', -0.3);
    } else if (sentiment === 'neutral') {
      query = query.gte('sentiment_score', -0.3).lte('sentiment_score', 0.3);
    }

    // Filter by date range
    if (startDate) {
      query = query.gte('collected_at', startDate);
    }
    if (endDate) {
      query = query.lte('collected_at', endDate);
    }

    // Order by most recent
    query = query.order('collected_at', { ascending: false });

    // Limit results if specified
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate statistics
    const stats = calculateNewsStats(data || []);

    return NextResponse.json({ 
      articles: data,
      stats 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new news article manually
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.' },
        { status: 503 }
      );
    }
    
    const supabase = getSupabase();
    const body = await request.json();
    const { 
      competitor_id, 
      title, 
      content,
      summary,
      source,
      url,
      sentiment_score,
      published_at
    } = body;

    // Validation
    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('news_articles')
      .insert({
        competitor_id,
        title,
        content,
        summary,
        source,
        url,
        sentiment_score: sentiment_score || 0,
        published_at: published_at || new Date().toISOString(),
        collected_at: new Date().toISOString(),
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

    return NextResponse.json({ article: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to calculate news statistics
function calculateNewsStats(articles: any[]) {
  if (!articles.length) {
    return {
      totalArticles: 0,
      competitorMentions: 0,
      positiveSentiment: 0,
      negativeSentiment: 0,
      neutralSentiment: 0,
      avgSentiment: 0,
      last24Hours: 0,
      thisWeek: 0,
    };
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const positiveArticles = articles.filter(a => (a.sentiment_score || 0) > 0.3);
  const negativeArticles = articles.filter(a => (a.sentiment_score || 0) < -0.3);
  const neutralArticles = articles.filter(a => Math.abs(a.sentiment_score || 0) <= 0.3);
  
  const last24Hours = articles.filter(a => new Date(a.collected_at) >= oneDayAgo).length;
  const thisWeek = articles.filter(a => new Date(a.collected_at) >= oneWeekAgo).length;

  const totalSentiment = articles.reduce((sum, a) => sum + (a.sentiment_score || 0), 0);
  const avgSentiment = articles.length > 0 ? totalSentiment / articles.length : 0;

  // Count unique competitors mentioned
  const uniqueCompetitors = new Set(articles.filter(a => a.competitor_id).map(a => a.competitor_id));

  return {
    totalArticles: articles.length,
    competitorMentions: uniqueCompetitors.size,
    positiveSentiment: positiveArticles.length,
    negativeSentiment: negativeArticles.length,
    neutralSentiment: neutralArticles.length,
    positivePercentage: Math.round((positiveArticles.length / articles.length) * 100),
    negativePercentage: Math.round((negativeArticles.length / articles.length) * 100),
    avgSentiment: Math.round(avgSentiment * 100) / 100,
    last24Hours,
    thisWeek,
  };
}
