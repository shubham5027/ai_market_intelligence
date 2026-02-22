import { tavily } from '@tavily/core';

// Initialize Tavily client
const getTavilyClient = () => {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not configured');
  }
  return tavily({ apiKey });
};

// Types
export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export interface ExtractResult {
  url: string;
  rawContent: string;
  extractedContent: string;
}

export interface ResearchResult {
  topic: string;
  summary: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  keyFindings: string[];
  timestamp: string;
}

export interface CrawlResult {
  baseUrl: string;
  pages: Array<{
    url: string;
    content: string;
  }>;
}

export interface MapResult {
  baseUrl: string;
  urls: string[];
}

// Search the web for news and information
export async function tavilySearch(
  query: string,
  options: {
    searchDepth?: 'basic' | 'advanced';
    maxResults?: number;
    includeAnswer?: boolean;
    includeRawContent?: boolean;
    topic?: 'general' | 'news';
    days?: number;
  } = {}
): Promise<{ answer?: string; results: SearchResult[] }> {
  try {
    const tvly = getTavilyClient();
    
    const response = await tvly.search(query, {
      searchDepth: options.searchDepth || 'advanced',
      maxResults: options.maxResults || 10,
      includeAnswer: options.includeAnswer ?? true,
      includeRawContent: options.includeRawContent ? 'markdown' : false,
      topic: options.topic || 'news',
      days: options.days || 7,
    });

    return {
      answer: response.answer,
      results: (response.results || []).map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score || 0,
        publishedDate: r.publishedDate,
      })),
    };
  } catch (error: any) {
    console.error('Tavily search error:', error.message);
    throw error;
  }
}

// Extract content from specific URLs
export async function tavilyExtract(
  urls: string | string[]
): Promise<ExtractResult[]> {
  try {
    const tvly = getTavilyClient();
    const urlArray = Array.isArray(urls) ? urls : [urls];
    
    const response = await tvly.extract(urlArray);
    
    return (response.results || []).map((r: any) => ({
      url: r.url,
      rawContent: r.rawContent || '',
      extractedContent: r.content || r.rawContent || '',
    }));
  } catch (error: any) {
    console.error('Tavily extract error:', error.message);
    throw error;
  }
}

// Crawl a website for comprehensive data gathering
export async function tavilyCrawl(
  url: string,
  options: {
    instructions?: string;
    maxDepth?: number;
    maxPages?: number;
  } = {}
): Promise<CrawlResult> {
  try {
    const tvly = getTavilyClient();
    
    const response = await tvly.crawl(url, {
      instructions: options.instructions,
      maxDepth: options.maxDepth || 2,
      limit: options.maxPages || 10,
    });

    return {
      baseUrl: url,
      pages: (response.results || []).map((r: any) => ({
        url: r.url,
        content: r.content || r.rawContent || '',
      })),
    };
  } catch (error: any) {
    console.error('Tavily crawl error:', error.message);
    throw error;
  }
}

// Map a website's structure
export async function tavilyMap(url: string): Promise<MapResult> {
  try {
    const tvly = getTavilyClient();
    
    const response = await tvly.map(url);

    return {
      baseUrl: url,
      urls: (response.results || []).map((r: any) => r.url),
    };
  } catch (error: any) {
    console.error('Tavily map error:', error.message);
    throw error;
  }
}

// Deep research on a topic - the most agentic feature
export async function tavilyResearch(
  topic: string,
  options: {
    maxSources?: number;
    includeKeyFindings?: boolean;
  } = {}
): Promise<ResearchResult> {
  try {
    const tvly = getTavilyClient();
    
    // Research is the most comprehensive Tavily feature
    const response = await tvly.search(topic, {
      searchDepth: 'advanced',
      maxResults: options.maxSources || 15,
      includeAnswer: true,
      includeRawContent: false,
      topic: 'general',
    });

    // Process results to create structured research output
    const sources = (response.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.substring(0, 300) || '',
    }));

    // Extract key findings from the content
    const keyFindings = extractKeyFindings(response.results || []);

    return {
      topic,
      summary: response.answer || 'No summary available',
      sources,
      keyFindings,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Tavily research error:', error.message);
    throw error;
  }
}

// Helper function to extract key findings from search results
function extractKeyFindings(results: any[]): string[] {
  const findings: string[] = [];
  
  for (const result of results.slice(0, 5)) {
    if (result.content) {
      // Extract sentences that might be key findings
      const sentences = result.content.split(/[.!?]+/);
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (
          trimmed.length > 50 &&
          trimmed.length < 300 &&
          !findings.includes(trimmed)
        ) {
          findings.push(trimmed);
          if (findings.length >= 5) break;
        }
      }
    }
    if (findings.length >= 5) break;
  }
  
  return findings;
}

// Competitor Intelligence Agent - combines multiple Tavily features
export async function runCompetitorIntelligenceAgent(
  competitorName: string,
  competitorWebsite?: string
): Promise<{
  news: SearchResult[];
  websiteInsights?: CrawlResult;
  competitorResearch: ResearchResult;
  marketPosition: ResearchResult;
}> {
  const results: any = {};

  // 1. Search for recent news about the competitor
  console.log(`Searching news for ${competitorName}...`);
  const newsSearch = await tavilySearch(`${competitorName} news latest updates`, {
    topic: 'news',
    maxResults: 10,
    days: 7,
  });
  results.news = newsSearch.results;

  // 2. If website provided, crawl for insights
  if (competitorWebsite) {
    console.log(`Crawling ${competitorWebsite}...`);
    try {
      results.websiteInsights = await tavilyCrawl(competitorWebsite, {
        instructions: 'Find pricing, products, features, and company announcements',
        maxPages: 5,
      });
    } catch (e) {
      console.error('Website crawl failed:', e);
    }
  }

  // 3. Deep research on the competitor
  console.log(`Researching ${competitorName}...`);
  results.competitorResearch = await tavilyResearch(
    `${competitorName} company analysis business strategy recent developments`
  );

  // 4. Research market position
  console.log(`Analyzing market position for ${competitorName}...`);
  results.marketPosition = await tavilyResearch(
    `${competitorName} market share competition industry position`
  );

  return results;
}

// News Intelligence Agent - focused on news gathering and analysis
export async function runNewsIntelligenceAgent(
  query: string,
  options: {
    competitor?: string;
    industry?: string;
    daysBack?: number;
  } = {}
): Promise<{
  articles: SearchResult[];
  summary: string;
  trends: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
}> {
  const searchQuery = [
    query,
    options.competitor ? `${options.competitor}` : '',
    options.industry ? `${options.industry} industry` : '',
    'news latest',
  ]
    .filter(Boolean)
    .join(' ');

  const searchResult = await tavilySearch(searchQuery, {
    topic: 'news',
    maxResults: 15,
    days: options.daysBack || 7,
    includeAnswer: true,
  });

  // Analyze sentiment from content
  const sentiment = analyzeSentiment(searchResult.results);
  
  // Extract trends
  const trends = extractTrends(searchResult.results);

  return {
    articles: searchResult.results,
    summary: searchResult.answer || 'No summary available',
    trends,
    sentiment,
  };
}

// Simple sentiment analysis based on keywords
function analyzeSentiment(
  results: SearchResult[]
): 'positive' | 'negative' | 'neutral' | 'mixed' {
  const positiveWords = ['growth', 'success', 'profit', 'gain', 'surge', 'rise', 'increase', 'innovation', 'breakthrough', 'record'];
  const negativeWords = ['decline', 'loss', 'fall', 'drop', 'crash', 'fail', 'layoff', 'cut', 'struggle', 'concern'];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const result of results) {
    const content = (result.title + ' ' + result.content).toLowerCase();
    positiveCount += positiveWords.filter(w => content.includes(w)).length;
    negativeCount += negativeWords.filter(w => content.includes(w)).length;
  }

  if (positiveCount > negativeCount * 1.5) return 'positive';
  if (negativeCount > positiveCount * 1.5) return 'negative';
  if (positiveCount > 0 && negativeCount > 0) return 'mixed';
  return 'neutral';
}

// Extract trending topics from results
function extractTrends(results: SearchResult[]): string[] {
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its']);

  for (const result of results) {
    const words = (result.title + ' ' + result.content)
      .toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 4 && !stopWords.has(w));

    for (const word of words) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }

  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
