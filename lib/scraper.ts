import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScrapeOptions {
  extractPricing?: boolean;
  extractProducts?: boolean;
  extractFeatures?: boolean;
  timeout?: number;
}

export async function scrapeWebsite(url: string, options: ScrapeOptions = {}): Promise<any> {
  const timeout = options.timeout || 30000;

  try {
    const response = await axios.get(url, {
      timeout,
      headers: {
        'User-Agent': process.env.USER_AGENT || 'Mozilla/5.0 (compatible; CompetitiveIntelBot/1.0)',
      },
    });

    const $ = cheerio.load(response.data);
    const result: any = {
      url,
      scrapedAt: new Date().toISOString(),
    };

    if (options.extractPricing) {
      result.pricing = extractPricing($);
    }

    if (options.extractProducts) {
      result.products = extractProducts($);
    }

    if (options.extractFeatures) {
      result.features = extractFeatures($);
    }

    result.text = extractMainContent($);

    return result;
  } catch (error: any) {
    console.error('Scraping error:', error.message);
    return {
      url,
      error: error.message,
      scrapedAt: new Date().toISOString(),
    };
  }
}

function extractPricing($: cheerio.CheerioAPI): any[] {
  const pricing: any[] = [];

  $('[class*="price"], [id*="price"]').each((i, elem) => {
    const text = $(elem).text().trim();
    const priceMatch = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);

    if (priceMatch) {
      const productName =
        $(elem).closest('[class*="product"]').find('[class*="title"], [class*="name"]').text().trim() ||
        `Product ${i + 1}`;

      pricing.push({
        productName,
        price: parseFloat(priceMatch[1].replace(/,/g, '')),
        currency: 'USD',
        rawText: text,
      });
    }
  });

  return pricing;
}

function extractProducts($: cheerio.CheerioAPI): any[] {
  const products: any[] = [];

  $('[class*="product"], [data-product]').each((i, elem) => {
    const title = $(elem).find('[class*="title"], [class*="name"], h2, h3').first().text().trim();
    const description = $(elem).find('[class*="description"], p').first().text().trim();
    const image = $(elem).find('img').first().attr('src');

    if (title) {
      products.push({
        title,
        description,
        image,
      });
    }
  });

  return products.slice(0, 20);
}

function extractFeatures($: cheerio.CheerioAPI): any[] {
  const features: any[] = [];

  $('[class*="feature"], [class*="benefit"]').each((i, elem) => {
    const title = $(elem).find('h3, h4, strong').first().text().trim();
    const description = $(elem).find('p, span').first().text().trim();

    if (title || description) {
      features.push({
        title,
        description,
      });
    }
  });

  return features.slice(0, 15);
}

function extractMainContent($: cheerio.CheerioAPI): string {
  $('script, style, nav, footer, header').remove();

  const mainContent =
    $('main').text() ||
    $('article').text() ||
    $('[class*="content"]').text() ||
    $('body').text();

  return mainContent
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 5000);
}

export async function scrapeTavily(query: string): Promise<any> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not configured');
  }

  try {
    const response = await axios.post(
      'https://api.tavily.com/search',
      {
        query,
        search_depth: 'advanced',
        max_results: 5,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
      }
    );

    return response.data.results || [];
  } catch (error: any) {
    console.error('Tavily API error:', error.message);
    return [];
  }
}
