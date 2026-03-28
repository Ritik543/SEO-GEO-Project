# Lumen Audit — AI SEO + GEO Analysis Platform

A production-ready, AI-powered SaaS for auditing any webpage's SEO and GEO (Generative Engine Optimization) readiness.

## Architecture

```
Geo/
├── server/              # Express.js API + BullMQ Workers
│   └── src/
│       ├── config/      # Redis, BullMQ queue config
│       ├── models/      # Mongoose schemas (Report)
│       ├── routes/      # API endpoints + SSE streaming
│       ├── services/    # Modular business logic
│       │   ├── crawler.service.js      # Puppeteer headless crawling
│       │   ├── content.service.js      # DOM extraction (Cheerio)
│       │   ├── schema.service.js       # JSON-LD extraction & validation
│       │   ├── compressor.service.js   # Token-efficient data compression
│       │   ├── ai.service.js           # Multi-LLM adapter (Gemini, OpenAI stub)
│       │   └── scoring.service.js      # Weighted score computation
│       ├── index.js     # Express server entry
│       └── worker.js    # BullMQ job processor
│
└── client/              # Next.js 15 App Router
    └── src/
        ├── app/         # Pages & global CSS (Intelligent Monolith design tokens)
        └── components/  # UI Components
            ├── Navbar/              # Glassmorphic top bar
            ├── AuditHero/           # URL input with glowing orb
            ├── AIPulseStatus/       # Real-time SSE terminal
            ├── Dashboard/           # Results layout shell
            ├── ScorePlane/          # SVG score rings
            ├── IssueList/           # Filterable issue list
            ├── RecommendationCard/  # Expandable fix cards
            ├── GeoInsights/         # Entity clarity & citation readiness
            └── SchemaViewer/        # JSON-LD viewer & copy
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- A Gemini API key

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env with your MONGODB_URI, REDIS_URL, and GEMINI_API_KEY
npm install

# Terminal 1: API Server
npm run dev

# Terminal 2: Worker
npm run worker
```

### 2. Frontend

```bash
cd client
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/audits` | Start a new audit (returns jobId) |
| `GET`  | `/api/v1/audits/stream/:jobId` | SSE real-time progress stream |
| `GET`  | `/api/v1/audits/report/:reportId` | Fetch completed audit report |
| `GET`  | `/api/v1/audits/history` | List recent audits |

## Design System

Uses the **Lumen Audit "Intelligent Monolith"** design system:
- Deep indigo surfaces with tonal layering (no borders)
- Inter (body) + Manrope (labels) typography
- Emerald (positive), Amber (warning), Rose (error) signal colors
- Glassmorphism on floating elements
- AI Pulse animation during processing

## Multi-LLM Support

The `ai.service.js` uses a provider pattern:
- `GeminiProvider` — active (default)
- `OpenAIProvider` — stub, ready for implementation
- Set `AI_PROVIDER=gemini|openai` in `.env`

## Deployment (Render)

1. **Web Service:** Deploy `/server` → `npm start`
2. **Background Worker:** Deploy `/server` → `npm run worker`
3. **Redis:** Use Render Redis or Upstash
4. **Frontend:** Deploy `/client` as a Next.js site
