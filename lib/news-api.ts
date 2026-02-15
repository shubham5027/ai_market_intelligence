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

  try {
    const tavilyResults = await scrapeTavily(`${query} news last ${daysBack} days`);

    const articles: NewsArticle[] = tavilyResults.slice(0, maxResults).map((result: any) => ({
      title: result.title || 'Untitled',
      content: result.content || result.snippet || '',
      source: new URL(result.url).hostname,
      url: result.url,
      publishedAt: result.published_date || new Date().toISOString(),
    }));

    return articles;
  } catch (error: any) {
    console.error('News search error:', error.message);
    return [];
  }
}

export async function searchNewsAlternative(
  query: string,
  options: NewsSearchOptions = {}
): Promise<NewsArticle[]> {
  const maxResults = options.maxResults || 10;

  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        pageSize: maxResults,
        sortBy: 'publishedAt',
        language: options.language || 'en',
        apiKey: process.env.NEWS_API_KEY,
      },
    });

    return response.data.articles.map((article: any) => ({
      title: article.title,
      content: article.description || article.content || '',
      source: article.source.name,
      url: article.url,
      publishedAt: article.publishedAt,
    }));
  } catch (error: any) {
    console.error('NewsAPI error:', error.message);
    return [];
  }
}
