import axios from 'axios';
import { scrapeTavily } from './scraper';

interface NewsSearchOptions {
  maxResults?: number;
  daysBack?: number;
  language?: string;
}

interface NewsArticle {
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: string;
}

export async function searchNews(
  query: string,
  options: NewsSearchOptions = {}
): Promise<NewsArticle[]> {
  const maxResults = options.maxResults || 10;
  const daysBack = options.daysBack || 7;

  // Try Tavily first
  try {
    console.log('Searching news with Tavily for:', query);
    const tavilyResults = await scrapeTavily(`${query} news`);

    if (tavilyResults && tavilyResults.length > 0) {
      const articles: NewsArticle[] = tavilyResults.slice(0, maxResults).map((result: any) => ({
        title: result.title || 'Untitled',
        content: result.content || result.snippet || '',
        source: result.url ? new URL(result.url).hostname : 'Unknown',
        url: result.url,
        publishedAt: result.published_date || new Date().toISOString(),
      }));
      console.log(`Found ${articles.length} articles from Tavily`);
      return articles;
    }
  } catch (error: any) {
    console.error('Tavily search error:', error.message);
  }

  // Fallback to NewsAPI
  console.log('Falling back to NewsAPI for:', query);
  return searchNewsAPI(query, options);
}

async function searchNewsAPI(
  query: string,
  options: NewsSearchOptions = {}
): Promise<NewsArticle[]> {
  const maxResults = options.maxResults || 10;
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    console.error('NEWS_API_KEY is not configured');
    return [];
  }

  try {
    // Calculate date range
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - (options.daysBack || 7));

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        pageSize: maxResults,
        sortBy: 'publishedAt',
        language: options.language || 'en',
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
        apiKey: apiKey,
      },
      timeout: 15000,
    });

    if (response.data.status === 'ok' && response.data.articles) {
      const articles = response.data.articles
        .filter((article: any) => article.title && article.title !== '[Removed]')
        .map((article: any) => ({
          title: article.title,
          content: article.description || article.content || '',
          source: article.source?.name || 'Unknown',
          url: article.url,
          publishedAt: article.publishedAt,
        }));
      console.log(`Found ${articles.length} articles from NewsAPI`);
      return articles;
    }
    return [];
  } catch (error: any) {
    console.error('NewsAPI error:', error.response?.data || error.message);
    return [];
  }
}

export async function searchNewsAlternative(
  query: string,
  options: NewsSearchOptions = {}
): Promise<NewsArticle[]> {
  return searchNewsAPI(query, options);
}
