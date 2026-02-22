<div align="center">

# 🎯 AI Market Intelligence Platform

### Enterprise-Grade Competitive Intelligence Powered by Multi-Agent AI

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Reference](#-api-reference) • [Deployment](#-deployment)

---

<img src="docs/assets/dashboard-preview.png" alt="Dashboard Preview" width="800">

*Real-time competitive intelligence dashboard with AI-powered insights*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**AI Market Intelligence** is a production-ready competitive intelligence platform that leverages a coordinated multi-agent AI architecture to continuously monitor competitors, detect market shifts, and generate actionable business insights.

### Why This Platform?

| Traditional CI Tools | AI Market Intelligence |
|---------------------|------------------------|
| Manual data collection | Automated AI-powered scraping |
| Static reports | Real-time dynamic insights |
| Single data source | Multi-source aggregation |
| Generic analysis | Context-aware SWOT & recommendations |
| Delayed alerts | Instant anomaly detection |

### Key Metrics

```
┌─────────────────────────────────────────────────────────────────┐
│  7 AI Agents  │  12 Dashboard Pages  │  10 Database Tables     │
│  REST APIs    │  Real-time Updates   │  Production Ready       │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🤖 AI Agent System

| Agent | Function | Output |
|-------|----------|--------|
| **Price Monitor** | Tracks competitor pricing changes in real-time | Price trends, change alerts |
| **Product Tracker** | Detects new features, products & updates | Product change timeline |
| **News Aggregator** | Collects & analyzes competitor news | Sentiment-analyzed feed |
| **SWOT Analyzer** | Strategic competitive analysis | Strengths, weaknesses, opportunities, threats |
| **Market Shift Detector** | Identifies industry trends & movements | Market shift reports |
| **Anomaly Detector** | Statistical pattern analysis | Unusual activity alerts |
| **Executive Reporter** | Generates comprehensive reports | Board-ready summaries |

### 📊 Dashboard Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time KPIs, recent alerts, activity overview |
| **Competitors** | Add, edit, delete, and scan competitors |
| **Alerts** | Severity-based notification system with filtering |
| **Price Monitoring** | Historical pricing with trend analysis |
| **Product Changes** | Feature and product evolution tracking |
| **Market Shifts** | Industry trend visualization |
| **News Feed** | Aggregated news with sentiment scores |
| **SWOT Analysis** | Interactive strategic analysis per competitor |
| **Anomalies** | Statistical outlier detection & severity |
| **Reports** | AI-generated executive summaries & exports |
| **Settings** | User preferences, dark mode, API configuration |

### 🔔 Alert System

- **Real-time notifications** for critical competitor activities
- **Severity levels**: Critical, High, Medium, Low, Info
- **Alert types**: Price changes, product updates, news, anomalies, market shifts
- **Filtering & bulk actions**: Mark as read, delete, filter by type/severity

---

## 🛠 Tech Stack

<table>
<tr>
<td valign="top" width="50%">

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework with App Router |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Accessible component library |
| Recharts | Data visualization |
| SWR | Data fetching & caching |
| date-fns | Date formatting |
| Sonner | Toast notifications |

</td>
<td valign="top" width="50%">

### Backend & AI
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | Serverless functions |
| OpenRouter / OpenAI | LLM inference (GPT-4, Claude) |
| Tavily API | Web search & content extraction |
| Supabase | PostgreSQL + real-time |
| Row Level Security | Data protection |

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** or **pnpm**
- **Supabase** account ([free tier available](https://supabase.com))
- **OpenRouter** or **OpenAI** API key

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-market-intelligence.git
cd ai-market-intelligence
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Configure Environment

Copy the example environment file and add your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Required: Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Required: LLM Provider (choose one)
OPENROUTER_API_KEY=sk-or-v1-...
# or
OPENAI_API_KEY=sk-...

# Optional: Enhanced web search
TAVILY_API_KEY=tvly-...
```

### 4. Setup Database

Run the SQL migration in your Supabase SQL Editor:

```sql
-- Copy contents from: supabase/migrations/20260215174503_create_competitive_intelligence_schema.sql
```

Or use Supabase CLI:

```bash
supabase db push
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — your platform is ready! 🎉

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `OPENROUTER_API_KEY` | ✅* | OpenRouter API key |
| `OPENAI_API_KEY` | ✅* | OpenAI API key (alternative to OpenRouter) |
| `TAVILY_API_KEY` | ❌ | Tavily API for enhanced web search |

*At least one LLM provider key is required.

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Navigate to **Settings > API** to get your keys
3. Go to **SQL Editor** and run the migration script
4. Enable **Row Level Security** (included in migration)

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI MARKET INTELLIGENCE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  Dashboard  │    │ Competitors │    │   Reports   │    │   Settings  │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └─────────────┘  │
│         │                  │                  │                             │
│         └──────────────────┼──────────────────┘                             │
│                            ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      NEXT.JS API ROUTES                              │   │
│  │  /api/competitors  /api/alerts  /api/agents/*  /api/reports         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                            │                                                │
│                            ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     AGENT ORCHESTRATOR                               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │  Price  │ │ Product │ │  News   │ │  SWOT   │ │ Market  │ ...   │   │
│  │  │  Agent  │ │  Agent  │ │  Agent  │ │  Agent  │ │  Agent  │       │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │   │
│  └───────┼──────────┼──────────┼──────────┼──────────┼────────────────┘   │
│          │          │          │          │          │                      │
│          ▼          ▼          ▼          ▼          ▼                      │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                     EXTERNAL SERVICES                              │     │
│  │     OpenRouter/OpenAI (LLM)    │    Tavily (Web Search)           │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                            │                                                │
│                            ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      SUPABASE (PostgreSQL)                          │   │
│  │  competitors │ alerts │ prices │ products │ news │ swot │ reports  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Multi-Agent System

The platform uses a coordinated multi-agent architecture where each agent specializes in a specific intelligence task:

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATOR                        │
│                                                              │
│  Coordinates execution • Manages dependencies • Aggregates   │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ PRICE AGENT   │    │ PRODUCT AGENT │    │ NEWS AGENT    │
│ - Web scraping│    │ - Feature diff│    │ - Aggregation │
│ - Trend detect│    │ - Release note│    │ - Sentiment   │
│ - Alerts      │    │ - Screenshots │    │ - Categorize  │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌───────────────┐
                    │ SWOT AGENT    │
                    │ - Synthesis   │
                    │ - Strategy    │
                    └───────────────┘
```

### C4 Architecture Diagrams

Comprehensive C4 diagrams are available in [docs/C4_DIAGRAM.md](docs/C4_DIAGRAM.md):
- System Context Diagram
- Container Diagram
- Component Diagrams
- Data Flow Diagrams
- Database ER Diagram

---

## 📡 API Reference

### Competitors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/competitors` | List all competitors |
| `POST` | `/api/competitors` | Add new competitor |
| `PATCH` | `/api/competitors/[id]` | Update competitor |
| `DELETE` | `/api/competitors/[id]` | Delete competitor |

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/agents/execute` | Execute specific agent |
| `POST` | `/api/agents/scan` | Full competitor scan |
| `POST` | `/api/agents/market-analysis` | Market-wide analysis |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports` | List all reports |
| `POST` | `/api/reports` | Generate new report |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/alerts` | Fetch alerts with filters |
| `PATCH` | `/api/alerts` | Bulk update alerts |
| `DELETE` | `/api/alerts` | Delete alerts |

### Example: Add a Competitor

```typescript
const response = await fetch('/api/competitors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Competitor Inc',
    industry: 'SaaS',
    website: 'https://competitor.com',
    description: 'Main competitor in the B2B space'
  })
});

const { data } = await response.json();
console.log('Added competitor:', data.id);
```

### Example: Run a Full Scan

```typescript
const response = await fetch('/api/agents/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    competitorId: 'uuid-here'
  })
});

const { results } = await response.json();
// Results from all agents: price, product, news, swot, anomaly
```

---

## 🗄 Database Schema

The platform uses **10 tables** in Supabase PostgreSQL:

| Table | Description |
|-------|-------------|
| `competitors` | Company profiles being monitored |
| `price_monitoring` | Historical price data & changes |
| `product_changes` | Feature & product updates |
| `news_articles` | Aggregated news with sentiment |
| `swot_analyses` | Strategic analysis results |
| `market_shifts` | Industry trend data |
| `alerts` | System notifications |
| `anomaly_detections` | Statistical anomaly records |
| `executive_reports` | Generated report documents |
| `agent_execution_logs` | Agent run history & metrics |

View the full ER diagram in [docs/C4_DIAGRAM.md](docs/C4_DIAGRAM.md#database-schema-diagram).

---

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-market-intelligence)

**Manual deployment:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Netlify

```bash
# Build command
npm run build

# Publish directory
.next
```

See [netlify.toml](netlify.toml) for configuration.

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables

Set these in your deployment platform:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENROUTER_API_KEY (or OPENAI_API_KEY)
TAVILY_API_KEY (optional)
```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 🔒 Security

### Built-in Security Features

- ✅ **Row Level Security (RLS)** on all Supabase tables
- ✅ **API key validation** for external services
- ✅ **Input sanitization** on all endpoints
- ✅ **CORS configuration** for production
- ✅ **Environment variable protection** (server-only secrets)

### Security Best Practices

```bash
# Never commit .env.local
echo ".env.local" >> .gitignore

# Rotate API keys regularly
# Use Supabase service role key only on server-side

# Enable RLS policies (included in migration)
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Prettier for formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) — React framework
- [Supabase](https://supabase.com/) — Backend as a Service
- [OpenRouter](https://openrouter.ai/) — LLM API gateway
- [Tavily](https://tavily.com/) — AI-optimized search API
- [shadcn/ui](https://ui.shadcn.com/) — Component library
- [Tailwind CSS](https://tailwindcss.com/) — CSS framework

---

<div align="center">

**Built with ❤️ for competitive intelligence teams**

[⬆ Back to top](#-ai-market-intelligence-platform)

</div>
