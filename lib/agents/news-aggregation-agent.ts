import { BaseAgent, AgentExecutionContext, AgentResult } from './base-agent';
import { supabase } from '@/lib/supabase';
import { callOpenRouter } from '@/lib/llm-client';
import { searchNews } from '@/lib/news-api';

export class NewsAggregationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'NewsAggregationAgent',
      description: 'Aggregates and analyzes competitor news and sentiment',
      model: 'openai/gpt-4-turbo',
      temperature: 0.4,
    });
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      await this.logExecution('news_aggregation', 'started', context, undefined, undefined, startTime);

      const { competitorId } = context;
      if (!competitorId) {
        throw new Error('Competitor ID is required');
      }

      const { data: competitor } = await supabase
        .from('competitors')
        .select('*')
        .eq('id', competitorId)
        .maybeSingle();

      if (!competitor) {
        throw new Error('Competitor not found');
      }

      const newsArticles = await searchNews(competitor.name, {
        maxResults: 10,
        daysBack: 7,
      });

      const analysisResults = [];

      for (const article of newsArticles) {
        const analysis = await callOpenRouter({
          model: this.config.model!,
          messages: [
            {
              role: 'system',
              content: `You are a news analysis expert. Analyze the article and provide:
1. A concise summary (2-3 sentences)
2. Sentiment score (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)
3. Key topics and themes
4. Business impact assessment

Return JSON format.`,
            },
            {
              role: 'user',
              content: `Title: ${article.title}

Content: ${article.content}

Analyze this article about ${competitor.name} and return:
{
  "summary": "Brief summary",
  "sentimentScore": 0.5,
  "keyTopics": ["topic1", "topic2"],
  "businessImpact": "high|medium|low",
  "insights": "Key insights"
}`,
            },
          ],
          temperature: this.config.temperature,
        });

        const articleAnalysis = JSON.parse(analysis);

        await supabase.from('news_articles').insert({
          competitor_id: competitorId,
          title: article.title,
          content: article.content,
          summary: articleAnalysis.summary,
          source: article.source,
          url: article.url,
          sentiment_score: articleAnalysis.sentimentScore,
          published_at: article.publishedAt,
          collected_at: new Date().toISOString(),
        });

        analysisResults.push({
          ...article,
          ...articleAnalysis,
        });

        if (
          articleAnalysis.businessImpact === 'high' &&
          Math.abs(articleAnalysis.sentimentScore) > 0.6
        ) {
          await this.createAlert(
            'news_alert',
            `Important News: ${article.title}`,
            articleAnalysis.summary,
            articleAnalysis.sentimentScore < 0 ? 'warning' : 'info',
            'competitor',
            competitorId,
            { article, analysis: articleAnalysis }
          );
        }
      }

      await this.logExecution(
        'news_aggregation',
        'completed',
        context,
        { articlesAnalyzed: analysisResults.length },
        undefined,
        startTime
      );

      return {
        success: true,
        data: { articles: analysisResults },
        confidence: 0.88,
        metadata: {
          articlesAnalyzed: analysisResults.length,
          averageSentiment:
            analysisResults.reduce((sum, a) => sum + a.sentimentScore, 0) /
            analysisResults.length,
        },
      };
    } catch (error: any) {
      await this.logExecution(
        'news_aggregation',
        'failed',
        context,
        undefined,
        error.message,
        startTime
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }
}
