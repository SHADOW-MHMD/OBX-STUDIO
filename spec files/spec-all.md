# OBX-STUDIO — Complete App Specification

> **Version:** 1.0 (MVP Spec)  
> **Status:** Production-Ready  
> **Last Updated:** 2025  
> **License:** MIT (Open Source)

---

## 1. PRODUCT REQUIREMENTS DOCUMENT (PRD)

### 1.1 Executive Summary

**OBX-Studio** is a free, open-source, BYOK (Bring Your Own Key) web application that helps solo founders and indie hackers transform vague app ideas into structured, agent-ready specifications. It conducts a multi-turn planning interview, maintains a visual 2D canvas of requirements/architecture, and outputs JSON/Markdown specs tailored for AI coding agents (Cursor, v0, Bolt, Lovable, etc.).

**Core Value Proposition:** *"Stop iterating prompts. Start shipping specs."*

### 1.2 Problem Statement

| Pain Point | Current Workaround | Failure Mode |
|------------|-------------------|--------------|
| **Vague plans → broken agent output** | Copy-paste prompt templates | Rigid, misses project-specific context |
| | Iterative refinement (10+ turns) | Expensive, context drift, inconsistent quality |
| **Hidden requirements undiscovered** | Ad-hoc ChatGPT/Claude prompting | Founders don't know what they don't know |
| **Architecture disasters** | None (reactive debugging) | Costly rewrites, security flaws, scaling walls |

**Primary Persona:** *Solo Founder / Indie Hacker*  
- Time-poor, context-switching heavily
- Uses **Cursor/Copilot** (IDE-native) AND **v0/Bolt/Lovable** (prompt-to-app)
- Cannot afford prompt engineers
- Needs **one clean spec** → **hand off to agent** → **iterate on code**

### 1.3 Solution Overview

**OBX-Studio** is an **interactive planning interviewer** that:
1. **Interviews** the founder via structured multi-turn conversation
2. **Extracts** hidden requirements, constraints, and edge cases
3. **Visualizes** the evolving spec on a 2D neural canvas (nodes = concepts, edges = relationships)
4. **Enforces** architecture guardrails (auth, data model, API design, security)
5. **Outputs** tool-specific specs (JSON/MD) ready for Cursor, v0, Bolt, Lovable, or raw API agents

### 1.4 Key Features (MVP)

| Feature | Description | Differentiator |
|---------|-------------|----------------|
| **Multi-turn Interview** | Dynamic questioning adapts to project type (SaaS, marketplace, tool, etc.) | Extracts requirements founders forget: idempotency, rate limits, audit logs, soft deletes |
| **Architecture Guardrails** | Built-in patterns: RBAC, multi-tenancy, event sourcing, CQRS, webhook reliability | Prevents "v1 disasters" before code exists |
| **Tool-Specific Output Schemas** | Cursor `.mdc` rules, v0 JSON, Bolt spec, Lovable prompt, OpenAPI, DB migration SQL | One interview → all targets |
| **2D Neural Canvas** | Live visual map of features, data models, APIs, infra, risks | Spatial reasoning for complex systems |
| **BYOK + Model Selection** | User provides OpenRouter key; chooses model (Nemotron 550B, 55B MoE, etc.) | Zero marginal cost, privacy, model flexibility |
| **Prompt Engineering Moat** | Single dynamic system prompt + 12-message sliding window makes small models interview like pros | Core IP: prompt architecture, not model size |
| **Auto-Expiring Projects** | Inactive sessions auto-deleted after configurable TTL (default 30 days) | D1 stays lean, zero storage cost anxiety |

### 1.5 Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Latency (P95)** | < 800ms end-to-end (Worker + LLM) |
| **Token Usage/Turn** | ~200–400 tokens (4k at turn 20) |
| **Availability** | 99.9% (Cloudflare SLA) |
| **Data Retention** | 30 days default, user-configurable 1–365 days |
| **Browser Support** | Last 2 versions of Chrome, Firefox, Safari, Edge |
| **Accessibility** | WCAG 2.1 AA |

### 1.6 Out of Scope (MVP)

- Team collaboration / multiplayer
- GitHub/GitLab direct PR generation
- Visual drag-and-drop canvas editing (read-only in MVP)
- Plugin marketplace for custom guardrails
- Mobile-native app (responsive web only)

---

## 2. PITCH DECK

### Slide 1: Title
```
OBX-Studio
The Planning Layer for AI-Native Development
Free • Open Source • BYOK
```

### Slide 2: The Problem
> **"Agents don't build what you mean. They build what you specify."**
>
> - Solo founders waste **40% of dev time** on prompt iteration
> - Average **12.3 turns** to get a working spec from ChatGPT
> - **$3,200/project** in wasted agent compute (est.)
> - Critical requirements **always missed**: idempotency, authZ, audit, migrations

### Slide 3: The Insight
> **Planning ≠ Prompting**
>
> - Prompting = *text generation*
> - Planning = *requirements extraction + architecture validation + tool adaptation*
>
> **The gap is structural, not linguistic.**

### Slide 4: Solution
> **OBX-Studio interviews you like a senior architect.**
>
> - 15–20 targeted questions → complete spec
> - Live canvas shows *what exists, what connects, what's missing*
> - Guardrails catch **security, scaling, data integrity** issues pre-code
> - One-click export → Cursor, v0, Bolt, Lovable, OpenAPI, SQL

### Slide 5: Moat — Prompt Engineering as Compiler
```
User Intent (vague)
       ↓
[Dynamic System Prompt + Canvas State + 12-Turn History]
       ↓
Small Model (Nemotron 55B MoE) → Pro-Level Interviewer
       ↓
Structured Spec (JSON/MD) → Any Agent
```
> **We don't need GPT-4o. We need better prompts.**

### Slide 6: Business Model
> **$0. Free. Open Source. Forever.**
>
> - BYOK → users pay their own LLM bills
> - Cloudflare Workers/Pages → ~$0 hosting (free tier)
> - D1 auto-expiry → predictable storage
> - **No monetization = no conflict of interest**

### Slide 7: Traction Targets (Post-Launch)
| Metric | 30 Days | 90 Days | 180 Days |
|--------|---------|---------|----------|
| Weekly Active Users | 500 | 3,000 | 10,000 |
| Specs Generated | 2,000 | 15,000 | 60,000 |
| GitHub Stars | 800 | 3,500 | 10,000 |
| Community Contributors | 5 | 25 | 100 |

### Slide 8: Roadmap Teaser
> **v1.0** — Interviewer + Canvas + Multi-Target Export  
> **v1.5** — GitHub Sync, Spec Versioning, Team Workspaces  
> **v2.0** — Agent Orchestration: *Spec → Code → Test → Deploy* in one flow

### Slide 9: Call to Action
```
git clone github.com/obx-studio/obx-studio
npm install && npm run dev
# Add OPENROUTER_KEY → Start Planning
```

---

## 3. ROADMAP

### Phase 0: Pre-Launch (Weeks 1–4) ✅ *Current*
- [x] Core interview loop + canvas serialization
- [x] BYOK + OpenRouter integration + model selector
- [x] Next.js + Hono + D1 + Supabase Auth + jose
- [x] `ctx.waitUntil()` background writes
- [x] Auto-expiry cleanup cron
- [x] Export: Cursor `.mdc`, v0 JSON, Bolt spec, Lovable prompt, OpenAPI 3.1, SQL migrations
- [ ] Landing page + docs + demo video
- [ ] GitHub repo public + MIT license
- [ ] Community Discord + feedback loop

---

### Phase 1: MVP Launch (Weeks 5–8) 🚀
| Epic | Stories | Done When |
|------|---------|-----------|
| **Public Launch** | Deploy to `studio.obx.dev`, custom domain, Cloudflare Pages | Live + indexed |
| **Onboarding** | First-run wizard: key setup, model pick, project type templates | < 2 min to first question |
| **Observability** | Workers Analytics Engine + custom events (turn count, token use, export target) | Dashboards in Cloudflare |
| **Resilience** | Retry logic for OpenRouter, graceful degradation, rate-limit UI | Zero silent failures |
| **SEO/Discovery** | Sitemap, Open Graph, `llms.txt` for agent crawlers | Top 3 for "AI app planner" |

---

### Phase 2: v1.1 — Polish & Power (Months 3–4)
| Feature | Spec |
|---------|------|
| **Spec Versioning** | Git-like history per project; diff viewer; rollback |
| **Project Templates** | SaaS, Marketplace, AI Tool, Chrome Ext, Mobile API — pre-seeded guardrails |
| **Import/Resume** | Paste existing spec → canvas populates → continue interview |
| **Custom Guardrails** | User-defined rules (e.g., "enforce Row Level Security", "require OpenTelemetry") |
| **Keyboard-First UX** | Vim mode, command palette, shortcuts for power users |

---

### Phase 3: v1.5 — Collaboration & Integration (Months 5–7)
| Feature | Spec |
|---------|------|
| **GitHub Sync** | Push spec → `.github/spec/`; PR on changes; Actions lint spec |
| **Team Workspaces** | Invite-only projects; shared BYOK pool (optional); role-based access |
| **Agent Feedback Loop** | Paste agent error/log → OBX suggests spec fix → re-export |
| **Plugin API** | WASM-based custom validators, exporters, question packs |

---

### Phase 4: v2.0 — The Agent Orchestrator (Months 8–12)
> **Vision:** *Spec → Running App in One Session*

| Capability | Description |
|------------|-------------|
| **Agent Router** | OBX spins up Cursor/v0/Bolt via API, feeds spec, monitors output |
| **Auto-Remediation** | Build fails → OBX analyzes error → patches spec → re-triggers |
| **Deploy Preview** | Cloudflare Pages/Workers/Vercel preview URL auto-generated |
| **Cost Ledger** | Per-project LLM token spend, agent compute, deploy minutes |
| **Enterprise SSO** | OIDC/SAML, audit logs, data residency controls |

---

## 4. TECHNICAL ARCHITECTURE

### 4.1 System Context Diagram

```
┌─────────────┐     HTTPS      ┌──────────────────┐
│   Browser   │◄──────────────►│  Cloudflare Pages │
│  (Next.js)  │                │  (Static Assets)  │
└──────┬──────┘                └────────┬─────────┘
       │                                │
       │ API Calls (JSON)               │
       ▼                                ▼
┌─────────────────────────────────────────────────────┐
│           Cloudflare Workers (Hono)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Interview   │  │ Canvas      │  │ Export      │  │
│  │ API         │  │ API         │  │ API         │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
│         │                │                │          │
│         ▼                ▼                ▼          │
│  ┌─────────────────────────────────────────────┐    │
│  │           D1 (SQLite at Edge)               │    │
│  │  sessions, messages, canvas_nodes, exports  │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
       │                         │
       │ Supabase JWT            │ OpenRouter API
       ▼                         ▼
┌─────────────┐           ┌───────────────┐
│  Supabase   │           │  OpenRouter   │
│  Auth       │           │  (LLM Gateway)│
└─────────────┘           └───────────────┘
```

### 4.2 Data Model (D1 Schema)

```sql
-- Core session
CREATE TABLE sessions (
  id              TEXT PRIMARY KEY,           -- UUID v7
  user_id         TEXT NOT NULL,              -- Supabase sub
  title           TEXT NOT NULL DEFAULT '',
  project_type    TEXT,                       -- saas, marketplace, tool, etc.
  model_slug      TEXT NOT NULL,              -- e.g., nemotron-3-ultra
  openrouter_key  TEXT NOT NULL,              -- Encrypted at rest (AES-GCM)
  status          TEXT NOT NULL DEFAULT 'active', -- active, completed, archived
  expires_at      INTEGER NOT NULL,           -- Unix ms, auto-cleanup target
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

-- Interview messages (12-turn sliding window kept in memory; full history in DB)
CREATE TABLE messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content         TEXT NOT NULL,
  token_count     INTEGER NOT NULL DEFAULT 0,
  canvas_snapshot TEXT,                       -- JSON string of canvas at this turn
  created_at      INTEGER NOT NULL
);
CREATE INDEX idx_messages_session ON messages(session_id, created_at);

-- Canvas nodes (requirements, features, data models, APIs, risks, decisions)
CREATE TABLE canvas_nodes (
  id              TEXT PRIMARY KEY,           -- UUID v7
  session_id      TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,              -- feature, entity, api, risk, decision, constraint
  label           TEXT NOT NULL,
  description     TEXT,
  position_x      REAL NOT NULL,
  position_y      REAL NOT NULL,
  metadata        TEXT,                       -- JSON: {priority, status, tags, guardrails}
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);
CREATE INDEX idx_canvas_session ON canvas_nodes(session_id);

-- Canvas edges (relationships)
CREATE TABLE canvas_edges (
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  source_id       TEXT NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  target_id       TEXT NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,              -- depends_on, contains, implements, mitigates, conflicts_with
  label           TEXT,
  created_at      INTEGER NOT NULL
);
CREATE INDEX idx_edges_session ON canvas_edges(session_id);

-- Exported specs (audit trail)
CREATE TABLE exports (
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  target          TEXT NOT NULL,              -- cursor, v0, bolt, lovable, openapi, sql
  content         TEXT NOT NULL,              -- Full exported spec
  created_at      INTEGER NOT NULL
);

-- Cleanup cron metadata
CREATE TABLE cleanup_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  deleted_count   INTEGER NOT NULL,
  oldest_kept     INTEGER,
  duration_ms     INTEGER NOT NULL,
  created_at      INTEGER NOT NULL
);
```

### 4.3 API Surface (Hono Routes)

```typescript
// POST   /api/sessions              → Create session (validate key, model)
// GET    /api/sessions/:id          → Load session + canvas + recent messages
// POST   /api/sessions/:id/turn     → Submit user answer → get next question + canvas delta
// GET   