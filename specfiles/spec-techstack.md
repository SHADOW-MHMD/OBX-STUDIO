# Technical Architecture

## Recommended Stack (with justification)

| Layer | Choice | Justification |
|-------|--------|---------------|
| **Framework** | Next.js 14+ (App Router) | Vercel-native, serverless functions, streaming, edge middleware, excellent DX |
| **Language** | TypeScript | Type safety for AI prompts/responses, database schemas, API contracts |
| **Styling** | Tailwind CSS | Rapid UI iteration, small bundle, works with shadcn/ui for accessible components |
| **Auth** | Supabase Auth | Managed email/password + OAuth (GitHub, Google), JWTs, row-level security, generous free tier |
| **Database** | Cloudflare D1 (SQLite) | Serverless SQLite, global replication, HTTP API, free tier generous, works with Drizzle ORM |
| **ORM** | Drizzle ORM | Type-safe, lightweight, supports D1, migrations, studio UI |
| **AI Gateway** | OpenRouter (free tier) | Access to multiple free models (Llama 3, Gemma, Mistral), automatic fallback, unified API |
| **PDF Generation** | `@react-pdf/renderer` or `pdfmake` | Client-side, React-native, no server cost, supports complex layouts |
| **State/Forms** | React Hook Form + Zod | Type-safe validation, matches Drizzle schemas |
| **Deployment** | Vercel (frontend) + Cloudflare (D1) | Native Next.js support, edge network, preview deployments |
| **Observability** | Vercel Analytics + Logtail/Sentry | Free tier covers errors, performance, user flows |

---

## System Architecture Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
|                              USER BROWSER                                   |
|  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    |
|  │  Interview   │  │  Dashboard   │  │  Document    │  │   Auth UI    │    |
|  │   Chat UI    │  │  (History)   │  │  Builder     │  │  (Supabase)  │    |
|  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    |
└─────────│─────────────────│─────────────────│─────────────────│────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
|                          VERCEL EDGE / SERVERLESS                           |
|  ┌──────────────────────────────────────────────────────────────────────┐   |
|  │                      NEXT.JS APP ROUTER                              │   |
|  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   |
|  │  │ /api/auth/* │  │/api/interview│  │/api/docs/*  │  │/api/models │  │   |
|  │  │ (Supabase)  │  │ (AI logic)  │  │ (templates) │  │ (fallback) │  │   |
|  │  └─────────────┘  └──────┬──────┘  └─────────────┘  └────────────┘  │   |
|  └─────────────────────────│────────────────────────────────────────────┘   |
└────────────────────────────│────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  SUPABASE     │   │  CLOUDFLARE   │   │  OPENROUTER   │
│  AUTH         │   │  D1 (SQLite)  │   │  API          │
│  (JWT, OAuth) │   │  (Interviews, │   │  (Free Tier)  │
│               │   │   Documents,  │   │  Primary +    │
│  - Users      │   │   Templates)  │   │  Fallback     │
│  - Sessions   │   │               │   │  Models       │
└───────────────┘   └───────────────┘   └───────────────┘
        ▲                    ▲
        │                    │
        └────────────────────┘
              (Client PDF Gen)
```

---

## Database Schema

```sql
-- Cloudflare D1 (SQLite) - Drizzle ORM schema

-- Users (synced from Supabase Auth via webhook or on first login)
CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- Supabase UUID
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- Interviews - one per project idea
CREATE TABLE interviews (
  id TEXT PRIMARY KEY,           -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,           -- User-defined or AI-suggested
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' | 'completed' | 'archived'
  current_phase TEXT,            -- 'problem' | 'users' | 'features' | 'tech' | 'monetization' | 'constraints' | 'review'
  context_summary TEXT,          -- Rolling summary for AI context window
  message_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  completed_at INTEGER
);

-- Messages - each Q&A turn
CREATE TABLE messages (
  id TEXT PRIMARY KEY,           -- UUID
  interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  role TEXT NOT NULL,            -- 'assistant' | 'user' | 'system'
  content TEXT NOT NULL,
  phase TEXT,                    -- Which phase this message belongs to
  tokens_used INTEGER,           -- For cost tracking
  model_used TEXT,               -- Which model responded
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- Generated Documents
CREATE TABLE documents (
  id TEXT PRIMARY KEY,           -- UUID
  interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL,   -- 'roadmap' | 'spec' | 'prd' | 'backlog' | 'kanban'
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,    -- Structured data for regeneration
  pdf_blob_key TEXT,             -- Optional: R2 key if server-generated
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- Document Templates (user-customizable)
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE, -- NULL = system template
  name TEXT NOT NULL,
  type TEXT NOT NULL,            -- 'roadmap' | 'spec' | 'prd' | 'backlog' | 'kanban'
  schema_json TEXT NOT NULL,     -- Zod/JSON schema for content structure