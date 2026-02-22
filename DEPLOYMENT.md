# Deployment Checklist

Complete this checklist to deploy your AI Market Intelligence platform.

---

## ✅ Pre-Deployment Verification

### 1. Environment Configuration

- [ ] **Create `.env.local`** file in project root
- [ ] **Supabase credentials** (REQUIRED)
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- [ ] **LLM API Key** (REQUIRED - choose one)
  ```env
  OPENROUTER_API_KEY=sk-or-v1-...  # Recommended - multi-model access
  # OR
  OPENAI_API_KEY=sk-...             # Direct OpenAI
  ```
- [ ] **Tavily API Key** (Optional - for web search)
  ```env
  TAVILY_API_KEY=tvly-...
  ```

### 2. Database Setup

- [ ] **Create Supabase project** at https://supabase.com
- [ ] **Run migrations** - Execute SQL in Supabase SQL Editor:
  ```
  File: supabase/migrations/run_this_in_supabase.sql
  ```
- [ ] **Verify tables created** - Check these 10 tables exist:
  - `competitors`
  - `price_monitoring`
  - `product_changes`
  - `news_articles`
  - `swot_analyses`
  - `market_shifts`
  - `alerts`
  - `executive_reports`
  - `anomaly_detections`
  - `agent_execution_logs`

### 3. Local Build Test

```bash
# Install dependencies
npm install

# Run type check
npm run typecheck

# Test production build
npm run build

# Preview production build
npm run start
```

- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] Application loads at http://localhost:3000

---

## 🚀 Deployment Options

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod
```

**After deployment:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env.local`
3. Redeploy to apply changes

### Option B: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Initialize (if not already)
netlify init

# Deploy preview
netlify deploy

# Deploy production
netlify deploy --prod
```

**After deployment:**
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add all variables from `.env.local`
3. Trigger redeploy

### Option C: Docker

```dockerfile
# Create Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
EXPOSE 3000
```

```bash
docker build -t ai-market-intelligence .
docker run -p 3000:3000 --env-file .env.local ai-market-intelligence
```

---

## 🔍 Post-Deployment Verification

### Functional Tests

- [ ] **Dashboard loads** - Visit `/` and check overview renders
- [ ] **Add competitor** - Navigate to Competitors → Add Competitor
- [ ] **Run scan** - Click "Run Scan" on a competitor
- [ ] **Check alerts** - Visit Alerts page, verify data loads
- [ ] **Generate report** - Reports → Generate Report → Executive Summary
- [ ] **SWOT analysis** - SWOT → Run Analysis (select competitor)

### API Health Checks

Test these endpoints return 200 OK:

```bash
# Replace YOUR_DOMAIN with your deployment URL
curl https://YOUR_DOMAIN/api/competitors
curl https://YOUR_DOMAIN/api/alerts
curl https://YOUR_DOMAIN/api/reports
curl https://YOUR_DOMAIN/api/dashboard/overview
```

### Performance Checks

- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 4s
- [ ] No console errors in browser
- [ ] API responses < 500ms for GET requests

---

## 📊 Platform Features Summary

| Page | Functionality |
|------|---------------|
| Dashboard | Overview stats, recent activity, quick actions |
| Competitors | Add/Edit/Delete competitors, run AI scans |
| Alerts | View/filter alerts, mark read, delete |
| Anomalies | Run detection, view details, filter by severity |
| Market Shifts | Research topics, scan markets, add manual shifts |
| News | Fetch news, AI summarization, competitor news |
| Price Monitoring | Track prices, run scans, add/delete entries |
| Product Changes | Detect changes, add manual entries, filter |
| Reports | Generate AI reports, view, export, delete |
| SWOT | Run competitor SWOT analysis, view history |
| Settings | Profile, notifications, API config, appearance |

---

## 🔧 Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues

1. Verify Supabase URL format: `https://xxxxx.supabase.co`
2. Check anon key is complete (long JWT token)
3. Ensure RLS policies are created (in migration file)

### API Errors

1. Check browser Network tab for failing requests
2. Verify environment variables are set in deployment
3. Check Vercel/Netlify function logs

### LLM Not Working

1. Verify `OPENROUTER_API_KEY` or `OPENAI_API_KEY` is set
2. Check API key has credits/quota
3. Review server logs for specific error messages

---

## 📈 Production Best Practices

1. **Enable Vercel Analytics** - For performance monitoring
2. **Set up error tracking** - Consider Sentry integration
3. **Configure rate limiting** - Protect API endpoints
4. **Enable caching** - Use Vercel edge caching
5. **Monitor costs** - Track LLM API usage
6. **Regular backups** - Export Supabase data weekly

---

## 🔑 API Keys & Services

| Service | Purpose | Get Key |
|---------|---------|---------|
| Supabase | Database & Auth | https://supabase.com |
| OpenRouter | Multi-model LLM | https://openrouter.ai |
| OpenAI | GPT models | https://platform.openai.com |
| Tavily | Web search & scraping | https://tavily.com |

---

## 📝 Quick Start After Deployment

1. **Add your first competitor**
   - Navigate to Competitors page
   - Click "Add Competitor"
   - Enter: Name, Website, Industry

2. **Run initial scan**
   - Click "Run Scan" on competitor card
   - Wait for AI agents to complete
   - Check Alerts for new findings

3. **Generate executive report**
   - Go to Reports page
   - Click "Generate Report"
   - Select "Executive Summary"
   - Review AI-generated insights

---

*Last updated: February 2026*
