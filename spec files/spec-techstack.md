# Technical Architecture

## Recommended Stack (with justification)

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | Next.js 14+ (App Router) on Cloudflare Pages | React ecosystem, RSC support, zero-config edge deployment, excellent DX for interactive chat UI |
| **Backend API** | Hono on Cloudflare Workers | Ultra-low latency (~1ms cold start), tiny bundle (~14kb), edge-native, TypeScript-first, middleware support |
| **Database** | Cloudflare D1 (SQLite at edge) | Serverless, pay-per-query, <10ms reads locally, SQL familiarity, automatic replication |
| **Auth** | Supabase Auth + `jose` library (JWKS caching) | Managed auth (email/password/OAuth), edge-compatible JWT verification via cached JWKS, no cold-start penalty |
| **LLM Access** | OpenRouter (BYOK) | Model agnostic, user controls cost/model choice, supports Nemotron 550B/55B MoE and all major models |
| **State/Canvas** | In-memory + D1 persistence, serialized to prompt | 2D neural canvas with nodes/edges, ~4k tokens at turn 20, 12-message sliding context window |
| **Background Jobs** | `ctx.waitUntil()` for fire-and-forget D1 writes | Zero user-perceived latency, no queue infrastructure needed for turn-based workload |

---

## System Architecture Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER (Browser)                                 │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE PAGES (Next.js)                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Interview UI   │  │  Canvas Editor  │  │  Spec Preview (JSON/MD)     │  │
│  │  (Chat + Form)  │  │  (React Flow)   │  │  + Export / Copy            │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘  │
└───────────│─────────────────────│─────────────────────────│─────────────────┘
            │                     │                         │
            ▼                     ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE WORKERS (Hono API)                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Middleware Chain                                                    │   │
│  │  1. CORS / Security Headers                                          │   │
│  │  2. Supabase JWT Verify (jose + cached JWKS)                        │   │
│  │  3. Rate Limit (per user/key)                                        │   │
│  │  4. Request Validation (Zod)                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                       │
│            ┌───────────────────────┼───────────────────────┐              │
│            ▼                       ▼                       ▼              │
│  ┌───────────────┐      ┌─────────────────┐      ┌───────────────┐       │
│  │ POST /chat    │      │ GET/POST /canvas│      │ POST /spec    │       │
│  │ - Append turn │      │ - Load/Save     │      │ - Generate    │       │
│  │ - Build prompt│      │ - Node/Edge CRUD│      │ - Stream JSON │       │
│  │ - Call LLM    │      │ - Versioning    │      │ - Download MD │       │
│  │ - Return msg  │      │                 │      │               │       │
│  └───────┬───────┘      └────────┬────────┘      └───────┬───────┘       │
│          │                       │                       │                │
│          ▼                       ▼                       ▼                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    D1 DATABASE (via ctx.waitUntil)                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ sessions │ │ messages │ │ canvas   │ │ specs    │ │ projects │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │  OpenRouter API  │  │  Supabase Auth   │  │  GitHub (OSS Repo)       │  │
│  │  (User's Key)    │  │  (JWKS Endpoint) │  │  (Deploy via Pages)      │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```sql
-- Enable WAL mode for better concurrent reads
PRAGMA journal_mode = WAL;

-- Users (synced from Supabase Auth via webhook or on first request)
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- Supabase UUID
  email TEXT UNIQUE NOT NULL,
  openrouter_key_encrypted TEXT,          -- Optional: encrypted BYOK storage
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Projects (top-level container, auto-deleted after inactivity)
CREATE TABLE projects (
  id TEXT PRIMARY KEY,                    -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_tool TEXT,                       -- 'cursor' | 'v0' | 'bolt' | 'lovable' | 'custom'
  model_preference TEXT,                  -- User's selected model via OpenRouter
  status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'archived' | 'deleted'
  last_activity_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  expires_at INTEGER,                     -- TTL for auto-cleanup
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER