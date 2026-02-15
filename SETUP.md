# Quick Setup Guide

## 1. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase (Already configured in your environment)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter API - Get your key at https://openrouter.ai/
OPENROUTER_API_KEY=your_openrouter_api_key

# Tavily API (Optional) - For enhanced web search
TAVILY_API_KEY=your_tavily_api_key

# OpenAI API (Optional) - Fallback if not using OpenRouter
OPENAI_API_KEY=your_openai_api_key
```

## 2. Database Setup

The database schema has already been created in your Supabase instance with:

- 10 tables for comprehensive intelligence tracking
- Row Level Security (RLS) enabled on all tables
- Optimized indexes for fast queries
- Policies configured for authenticated access

## 3. Install Dependencies

```bash
npm install
```

## 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see your application.

## 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## 6. Add Environment Variables to Vercel

In your Vercel project settings:
1. Go to Settings > Environment Variables
2. Add all variables from your `.env.local`
3. Redeploy your application

## 7. Getting Started

1. **Add Your First Competitor**
   - Navigate to the Competitors page
   - Click "Add Competitor"
   - Enter competitor details (name, industry, website)

2. **Run a Competitor Scan**
   - Click "Run Scan" on any competitor card
   - The system will execute all intelligence agents
   - Results will populate across dashboards

3. **Generate Executive Report**
   - Go to Reports page
   - Click "Generate Report"
   - Select period (daily, weekly, monthly)
   - View AI-generated insights and recommendations

4. **Monitor Alerts**
   - Check the Alerts page for real-time notifications
   - Critical events are automatically flagged
   - Mark alerts as read to track what you've reviewed

## 8. API Endpoints

All API endpoints are available at `/api/*`:

- `POST /api/competitors` - Add competitor
- `GET /api/competitors` - List competitors
- `POST /api/agents/scan` - Run full scan
- `POST /api/agents/execute` - Execute specific agents
- `POST /api/agents/market-analysis` - Market analysis
- `POST /api/reports/executive` - Generate report
- `GET /api/dashboard/overview` - Dashboard data
- `GET /api/alerts` - Fetch alerts

## 9. Customization

### Adding Custom Agents

1. Create a new agent class in `lib/agents/`
2. Extend `BaseAgent`
3. Implement the `execute` method
4. Register in `lib/agents/orchestrator.ts`

### Modifying Intelligence Models

Edit agent constructors to use different OpenRouter models:

```typescript
super({
  name: 'CustomAgent',
  model: 'anthropic/claude-3-opus', // or 'openai/gpt-4-turbo'
  temperature: 0.7,
});
```

### Custom Dashboard Components

Add new visualizations in `components/dashboard/` and update routes in `app/`.

## 10. Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] API keys validated
- [ ] Error monitoring setup
- [ ] Rate limiting configured
- [ ] Backup strategy in place
- [ ] Domain configured
- [ ] SSL certificate active

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review agent execution logs in the database
- Monitor Vercel deployment logs
- Check Supabase logs for database issues

## Security Notes

- Never commit `.env.local` to version control
- Rotate API keys regularly
- Monitor API usage and costs
- Review RLS policies periodically
- Keep dependencies updated
