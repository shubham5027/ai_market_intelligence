import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  tavilySearch,
  tavilyExtract,
  tavilyResearch,
  runNewsIntelligenceAgent,
  runCompetitorIntelligenceAgent,
} from '@/lib/tavily-agent';
import { callOpenRouter } from '@/lib/llm-client';

// POST - Run AI agent tasks for news intelligence
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'search':
        return handleSearch(params);
      case 'extract':
        return handleExtract(params);
      case 'research':
        return handleResearch(params);
      case 'news-intelligence':
        return handleNewsIntelligence(params);
      case 'competitor-intelligence':
        return handleCompetitorIntelligence(params);
      case 'analyze-article':
        return handleAnalyzeArticle(params);
      case 'summarize-news':
        return handleSummarizeNews(params);
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: error.message || 'Agent execution failed' },
      { status: 500 }
    );
  }
}

// Search action - basic web search
async function handleSearch(params: {
  query: string;
  topic?: 'general' | 'news';
  maxResults?: number;
  days?: number;
}) {
  const { query, topic = 'news', maxResults = 10, days = 7 } = params;

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  const result = await tavilySearch(query, {
    topic,
    maxResults,
    days,
    includeAnswer: true,
  });

  return NextResponse.json({
    success: true,
    action: 'search',
    data: result,
  });
}

// Extract action - extract content from URLs
async function handleExtract(params: { urls: string | string[] }) {
  const { urls } = params;

  if (!urls || (Array.isArray(urls) && urls.length === 0)) {
    return NextResponse.json({ error: 'URLs are required' }, { status: 400 });
  }

  const result = await tavilyExtract(urls);

  return NextResponse.json({
    success: true,
    action: 'extract',
    data: result,
  });
}

// Research action - deep research on a topic
async function handleResearch(params: {
  topic: string;
  maxSources?: number;
}) {
  const { topic, maxSources = 10 } = params;

  if (!topic) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
  }

  const result = await tavilyResearch(topic, { maxSources });

  // Save research to database if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      await supabase.from('agent_execution_logs').insert({
        agent_name: 'research-agent',
        execution_type: 'research',
        status: 'completed',
        input_data: { topic, maxSources },
        output_data: result,
      });
    } catch (e) {
      console.error('Failed to log research:', e);
    }
  }

  return NextResponse.json({
    success: true,
    action: 'research',
    data: result,
  });
}

// News Intelligence action - comprehensive news analysis
async function handleNewsIntelligence(params: {
  query: string;
  competitor?: string;
  industry?: string;
  daysBack?: number;
  saveToDb?: boolean;
}) {
  const { query, competitor, industry, daysBack = 7, saveToDb = true } = params;

  if (!query && !competitor) {
    return NextResponse.json(
      { error: 'Query or competitor is required' },
      { status: 400 }
    );
  }

  const result = await runNewsIntelligenceAgent(query || competitor || '', {
    competitor,
    industry,
    daysBack,
  });

  // Optionally save articles to database
  if (saveToDb && isSupabaseConfigured() && result.articles.length > 0) {
    try {
      const supabase = getSupabase();

      // Get competitor ID if provided
      let competitorId: string | null = null;
      if (competitor) {
        const { data: compData } = await supabase
          .from('competitors')
          .select('id')
          .ilike('name', `%${competitor}%`)
          .maybeSingle();
        competitorId = compData?.id;
      }

      // Save articles
      const articlesToSave = result.articles.slice(0, 10).map((article) => ({
        competitor_id: competitorId,
        title: article.title,
        content: article.content,
        summary: article.content.substring(0, 200),
        source: new URL(article.url).hostname,
        url: article.url,
        sentiment_score: result.sentiment === 'positive' ? 0.5 :
          result.sentiment === 'negative' ? -0.5 : 0,
        published_at: article.publishedDate || new Date().toISOString(),
        collected_at: new Date().toISOString(),
      }));

      await supabase.from('news_articles').insert(articlesToSave);
    } catch (e) {
      console.error('Failed to save articles:', e);
    }
  }

  return NextResponse.json({
    success: true,
    action: 'news-intelligence',
    data: result,
  });
}

// Competitor Intelligence action - full competitor analysis
async function handleCompetitorIntelligence(params: {
  competitorName: string;
  competitorWebsite?: string;
  saveToDb?: boolean;
}) {
  const { competitorName, competitorWebsite, saveToDb = true } = params;

  if (!competitorName) {
    return NextResponse.json(
      { error: 'Competitor name is required' },
      { status: 400 }
    );
  }

  const result = await runCompetitorIntelligenceAgent(
    competitorName,
    competitorWebsite
  );

  // Save insights to database
  if (saveToDb && isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();

      // Get or create competitor
      let { data: competitor } = await supabase
        .from('competitors')
        .select('id')
        .ilike('name', `%${competitorName}%`)
        .maybeSingle();

      if (!competitor) {
        const { data: newComp } = await supabase
          .from('competitors')
          .insert({
            name: competitorName,
            industry: 'Unknown',
            website: competitorWebsite,
            status: 'active',
          })
          .select('id')
          .single();
        competitor = newComp;
      }

      // Save news articles
      if (result.news?.length > 0 && competitor) {
        const articles = result.news.slice(0, 10).map((article) => ({
          competitor_id: competitor!.id,
          title: article.title,
          content: article.content,
          summary: article.content.substring(0, 200),
          source: new URL(article.url).hostname,
          url: article.url,
          sentiment_score: 0,
          published_at: article.publishedDate || new Date().toISOString(),
          collected_at: new Date().toISOString(),
        }));

        await supabase.from('news_articles').insert(articles);
      }

      // Log the execution
      await supabase.from('agent_execution_logs').insert({
        agent_name: 'competitor-intelligence-agent',
        execution_type: 'full-analysis',
        status: 'completed',
        input_data: { competitorName, competitorWebsite },
        output_data: {
          newsCount: result.news?.length || 0,
          hasWebsiteInsights: !!result.websiteInsights,
          researchSummary: result.competitorResearch?.summary?.substring(0, 500),
        },
      });
    } catch (e) {
      console.error('Failed to save competitor intelligence:', e);
    }
  }

  return NextResponse.json({
    success: true,
    action: 'competitor-intelligence',
    data: result,
  });
}

// Analyze a specific article with AI
async function handleAnalyzeArticle(params: {
  url?: string;
  content?: string;
  title?: string;
}) {
  const { url, content, title } = params;

  let articleContent = content;
  let articleTitle = title;

  // Extract content from URL if provided
  if (url && !content) {
    const extracted = await tavilyExtract(url);
    if (extracted.length > 0) {
      articleContent = extracted[0].extractedContent;
    }
  }

  if (!articleContent) {
    return NextResponse.json(
      { error: 'Content or URL is required' },
      { status: 400 }
    );
  }

  // Use OpenRouter to analyze the article
  const analysisPrompt = `Analyze this news article and provide:
1. A concise summary (2-3 sentences)
2. Key points (3-5 bullet points)
3. Sentiment (positive, negative, or neutral) with a score from -1 to 1
4. Entities mentioned (companies, people, products)
5. Potential business implications

Title: ${articleTitle || 'Unknown'}
Content: ${articleContent.substring(0, 3000)}

Respond in JSON format:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "sentiment": { "label": "positive|negative|neutral", "score": 0.5 },
  "entities": { "companies": [], "people": [], "products": [] },
  "implications": "..."
}`;

  try {
    const analysis = await callOpenRouter({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      maxTokens: 1000,
    });

    // Parse JSON response
    let parsedAnalysis;
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      parsedAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: analysis };
    } catch {
      parsedAnalysis = { raw: analysis };
    }

    return NextResponse.json({
      success: true,
      action: 'analyze-article',
      data: {
        url,
        title: articleTitle,
        analysis: parsedAnalysis,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      action: 'analyze-article',
      data: {
        url,
        title: articleTitle,
        analysis: {
          summary: articleContent.substring(0, 200),
          error: 'AI analysis unavailable: ' + error.message,
        },
      },
    });
  }
}

// Summarize multiple news articles
async function handleSummarizeNews(params: {
  articles?: Array<{ title: string; content: string }>;
  query?: string;
  competitor?: string;
}) {
  const { articles, query, competitor } = params;

  let articlesToSummarize = articles;

  // If no articles provided, search for them
  if (!articlesToSummarize && (query || competitor)) {
    const searchResult = await tavilySearch(query || competitor || '', {
      topic: 'news',
      maxResults: 10,
      includeAnswer: true,
    });

    articlesToSummarize = searchResult.results.map((r) => ({
      title: r.title,
      content: r.content,
    }));

    // If Tavily provided an answer, return it directly
    if (searchResult.answer) {
      return NextResponse.json({
        success: true,
        action: 'summarize-news',
        data: {
          summary: searchResult.answer,
          articleCount: articlesToSummarize.length,
          source: 'tavily-answer',
        },
      });
    }
  }

  if (!articlesToSummarize || articlesToSummarize.length === 0) {
    return NextResponse.json(
      { error: 'No articles to summarize' },
      { status: 400 }
    );
  }

  // Combine articles for summarization
  const combinedContent = articlesToSummarize
    .map((a, i) => `Article ${i + 1}: ${a.title}\n${a.content}`)
    .join('\n\n---\n\n')
    .substring(0, 8000);

  const summaryPrompt = `Summarize these ${articlesToSummarize.length} news articles into a comprehensive briefing. Include:
1. Executive summary (2-3 paragraphs)
2. Key themes and trends
3. Notable developments
4. Overall market sentiment

${combinedContent}

Provide a well-structured summary that a business executive could quickly read to understand the current news landscape.`;

  try {
    const summary = await callOpenRouter({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: summaryPrompt,
        },
      ],
      maxTokens: 1500,
    });

    return NextResponse.json({
      success: true,
      action: 'summarize-news',
      data: {
        summary,
        articleCount: articlesToSummarize.length,
        source: 'ai-generated',
      },
    });
  } catch (error: any) {
    // Fallback to basic summary
    return NextResponse.json({
      success: true,
      action: 'summarize-news',
      data: {
        summary: articlesToSummarize
          .slice(0, 5)
          .map((a) => `• ${a.title}`)
          .join('\n'),
        articleCount: articlesToSummarize.length,
        source: 'basic',
        error: error.message,
      },
    });
  }
}

// GET - Get available agent actions and their descriptions
export async function GET() {
  return NextResponse.json({
    agents: [
      {
        action: 'search',
        description: 'Search the web for news and information',
        params: {
          query: 'string (required)',
          topic: "'general' | 'news' (default: 'news')",
          maxResults: 'number (default: 10)',
          days: 'number (default: 7)',
        },
      },
      {
        action: 'extract',
        description: 'Extract content from specific URLs',
        params: {
          urls: 'string | string[] (required)',
        },
      },
      {
        action: 'research',
        description: 'Deep research on a topic with multiple sources',
        params: {
          topic: 'string (required)',
          maxSources: 'number (default: 10)',
        },
      },
      {
        action: 'news-intelligence',
        description: 'Comprehensive news analysis with trends and sentiment',
        params: {
          query: 'string',
          competitor: 'string',
          industry: 'string',
          daysBack: 'number (default: 7)',
          saveToDb: 'boolean (default: true)',
        },
      },
      {
        action: 'competitor-intelligence',
        description: 'Full competitor analysis including news, website insights, and market position',
        params: {
          competitorName: 'string (required)',
          competitorWebsite: 'string',
          saveToDb: 'boolean (default: true)',
        },
      },
      {
        action: 'analyze-article',
        description: 'AI-powered analysis of a specific article',
        params: {
          url: 'string',
          content: 'string',
          title: 'string',
        },
      },
      {
        action: 'summarize-news',
        description: 'Summarize multiple news articles into a briefing',
        params: {
          articles: 'Array<{title, content}>',
          query: 'string',
          competitor: 'string',
        },
      },
    ],
  });
}
