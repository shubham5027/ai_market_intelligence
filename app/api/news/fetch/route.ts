import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { searchNews } from '@/lib/news-api';
import { callOpenRouter } from '@/lib/llm-client';

// POST - Fetch news for a competitor from external sources
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
    const { competitor_id, query, max_results = 10, days_back = 7 } = body;

    let searchQuery = query;
    let competitorData = null;

    // If competitor_id provided, get competitor name for search
    if (competitor_id) {
      const { data: competitor, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('id', competitor_id)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!competitor) {
        return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
      }

      competitorData = competitor;
      searchQuery = searchQuery || competitor.name;
    }

    if (!searchQuery) {
      return NextResponse.json(
        { error: 'Either competitor_id or query is required' },
        { status: 400 }
      );
    }

    // Fetch news from external source
    const newsArticles = await searchNews(searchQuery, {
      maxResults: max_results,
      daysBack: days_back,
    });

    if (!newsArticles.length) {
      return NextResponse.json({ 
        message: 'No news articles found',
        articles: [],
        stats: { fetched: 0, saved: 0 }
      });
    }

    // Analyze and save each article
    const savedArticles = [];
    
    for (const article of newsArticles) {
      try {
        // Analyze sentiment using AI
        const sentimentScore = await analyzeSentiment(article.title, article.content);

        // Generate summary if content is long
        const summary = article.content.length > 200 
          ? await generateSummary(article.title, article.content)
          : article.content;

        // Save to database
        const { data: savedArticle, error: saveError } = await supabase
          .from('news_articles')
          .insert({
            competitor_id: competitor_id || null,
            title: article.title,
            content: article.content,
            summary,
            source: article.source,
            url: article.url,
            sentiment_score: sentimentScore,
            published_at: article.publishedAt,
            collected_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (!saveError && savedArticle) {
          savedArticles.push(savedArticle);

          // Create alert for significant news
          if (Math.abs(sentimentScore) > 0.6 && competitor_id) {
            await createNewsAlert(savedArticle, competitorData, sentimentScore, supabase);
          }
        }
      } catch (err) {
        console.error('Error processing article:', err);
        // Continue with next article
      }
    }

    return NextResponse.json({ 
      message: `Fetched and saved ${savedArticles.length} articles`,
      articles: savedArticles,
      stats: {
        fetched: newsArticles.length,
        saved: savedArticles.length,
      }
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Analyze sentiment of an article
async function analyzeSentiment(title: string, content: string): Promise<number> {
  try {
    const response = await callOpenRouter({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a sentiment analysis expert. Analyze the sentiment of the given text and return a single number between -1 (very negative) and 1 (very positive). Return ONLY the number, nothing else.',
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nContent: ${content.substring(0, 1000)}`,
        },
      ],
      temperature: 0.1,
    });

    const score = parseFloat(response.trim());
    return isNaN(score) ? 0 : Math.max(-1, Math.min(1, score));
  } catch (error) {
    // Return neutral sentiment on error
    return 0;
  }
}

// Generate a summary of the article
async function generateSummary(title: string, content: string): Promise<string> {
  try {
    const response = await callOpenRouter({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a news summarizer. Create a concise 1-2 sentence summary of the article. Be factual and objective.',
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nContent: ${content.substring(0, 2000)}`,
        },
      ],
      temperature: 0.3,
    });

    return response.trim();
  } catch (error) {
    // Return truncated content on error
    return content.substring(0, 200) + '...';
  }
}

// Create alert for significant news
async function createNewsAlert(article: any, competitor: any, sentimentScore: number, supabase: any) {
  const severity = Math.abs(sentimentScore) > 0.8 ? 'critical' : 'warning';
  const sentimentLabel = sentimentScore > 0 ? 'positive' : 'negative';

  await supabase.from('alerts').insert({
    alert_type: 'news',
    title: `Significant ${sentimentLabel} news - ${competitor?.name || 'Industry'}`,
    message: article.title,
    severity,
    related_entity_type: 'news_articles',
    related_entity_id: article.id,
    metadata: {
      competitor_id: article.competitor_id,
      source: article.source,
      url: article.url,
      sentiment_score: sentimentScore,
    },
    is_read: false,
    created_at: new Date().toISOString(),
  });
}
