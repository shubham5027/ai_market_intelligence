# CompetitiveAI - Multi-Agent Intelligence Platform

A production-ready AI-native competitive intelligence system built with Next.js, LangChain, and OpenRouter. This platform uses coordinated multi-agent architecture to continuously monitor competitors, detect market shifts, and generate actionable intelligence reports.

## Features

### Core Intelligence Capabilities

- **Price Monitoring Agent**: Tracks competitor pricing changes in real-time with anomaly detection
- **Product Change Detection**: Identifies new products, features, and availability changes
- **News Aggregation**: Collects and analyzes competitor news with sentiment analysis
- **SWOT Analysis**: Automated strategic analysis of competitor strengths, weaknesses, opportunities, and threats
- **Market Shift Detection**: Identifies emerging trends and significant market movements
- **Anomaly Detection**: Statistical analysis to detect unusual patterns and outliers
- **Executive Reports**: AI-generated comprehensive intelligence reports with strategic recommendations

### Dashboard Features

- **Real-time Overview**: Live metrics and KPIs across all intelligence streams
- **Competitor Management**: Add, monitor, and manage competitive landscape
- **Price Monitoring Dashboard**: Visualize pricing trends and significant changes
- **Product Change Panel**: Track product evolution and innovation
- **News Feed**: Aggregated news with sentiment analysis
- **SWOT Visualizer**: Interactive SWOT analysis results
- **Alert System**: Real-time notifications for critical events
- **Confidence Scoring**: AI-driven confidence metrics for all insights

## Tech Stack

### Backend
- **Node.js**: Runtime environment
- **Next.js 13**: Full-stack framework with API routes
- **LangChain JS**: Agent execution pipelines and tool integration
- **OpenRouter API**: Multi-model LLM access (Claude, GPT-4, etc.)
- **Supabase**: PostgreSQL database with real-time capabilities
- **Playwright**: Web scraping for competitor data
- **Tavily API**: Advanced web search and content extraction

### Frontend
- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: Component library
- **Recharts**: Data visualization
- **SWR**: Data fetching and caching

### Deployment
- **Vercel**: Serverless deployment platform
- **Vercel Edge Functions**: Serverless API routes

## Getting Started

### Prerequisites

```bash
Node.js 18+
npm or yarn
Supabase account
OpenRouter API key
Tavily API key (optional)
```

### Environment Variables

Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter API (for multi-model LLM access)
OPENROUTER_API_KEY=your_openrouter_api_key

# Tavily API (for web search)
TAVILY_API_KEY=your_tavily_api_key

# Optional: Direct OpenAI API
OPENAI_API_KEY=your_openai_api_key
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Database Setup

The database schema is automatically created using Supabase migrations. The system includes:

- Competitors table
- Price monitoring history
- Product change tracking
- News articles with sentiment
- SWOT analyses
- Market shift detection
- Real-time alerts
- Anomaly detection logs
- Executive reports
- Agent execution logs

## Architecture

### Multi-Agent System

The platform uses a coordinated multi-agent architecture:

1. **Base Agent**: Abstract base class for all specialized agents
2. **Price Monitoring Agent**: Scrapes and analyzes competitor pricing
3. **Product Change Agent**: Detects product and feature changes
4. **News Aggregation Agent**: Collects and analyzes news articles
5. **SWOT Analysis Agent**: Performs strategic competitive analysis
6. **Market Shift Agent**: Identifies market-wide trends and movements
7. **Anomaly Detection Agent**: Statistical analysis for unusual patterns
8. **Executive Report Agent**: Generates comprehensive intelligence reports

### Agent Orchestrator

The orchestrator coordinates agent execution:

- **Parallel Execution**: Run multiple agents simultaneously for efficiency
- **Sequential Execution**: Chain agents when data dependencies exist
- **Full Scan**: Execute all agents for comprehensive competitor analysis
- **Market Analysis**: Run market-level agents for industry insights

### API Routes

- `POST /api/competitors` - Add new competitor
- `GET /api/competitors` - List all competitors
- `PATCH /api/competitors/[id]` - Update competitor
- `POST /api/agents/execute` - Execute specific agents
- `POST /api/agents/scan` - Run full competitor scan
- `POST /api/agents/market-analysis` - Analyze market trends
- `POST /api/reports/executive` - Generate executive report
- `GET /api/dashboard/overview` - Get dashboard metrics
- `GET /api/alerts` - Fetch alerts
- `PATCH /api/alerts` - Mark alerts as read

## Usage

### Adding a Competitor

```typescript
const response = await fetch('/api/competitors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Competitor Inc',
    industry: 'SaaS',
    website: 'https://competitor.com',
    description: 'Main competitor in the market'
  })
});
```

### Running a Full Scan

```typescript
const response = await fetch('/api/agents/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    competitorId: 'competitor-uuid'
  })
});
```

### Generating Executive Report

```typescript
const response = await fetch('/api/reports/executive', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    period: 'weekly' // or 'daily', 'monthly'
  })
});
```

## Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

### Environment Variables on Vercel

Add all environment variables in the Vercel dashboard under Settings > Environment Variables.

## Security

- Row Level Security (RLS) enabled on all database tables
- API key validation for all external services
- Input sanitization and validation
- Secure credential management
- Rate limiting on API routes

## Performance Optimization

- SWR for client-side caching and revalidation
- API response caching
- Database query optimization with indexes
- Parallel agent execution
- Efficient data fetching patterns

## Monitoring and Logging

- Agent execution logs stored in database
- Success/failure tracking for all operations
- Performance metrics (execution duration)
- Error logging with detailed messages
- Alert system for critical events

## Future Enhancements

- Real-time WebSocket updates
- Advanced data visualization dashboards
- Custom agent creation interface
- Automated scheduled scans
- Integration with more data sources
- Machine learning for predictive analytics
- Mobile app for alerts and monitoring
- API access for third-party integrations

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
