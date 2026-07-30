# Product Roadmap: AI Project Interviewer & Document Generator

---

## MVP (Week 1–4)
**Goal:** End-to-end working flow: auth → adaptive interview → document selection → client-side PDF download.

### Features
- **Auth & Data**
  - Supabase Auth (email/password + GitHub/Google OAuth)
  - Cloudflare D1 schema: `users`, `interviews`, `messages`, `documents`
  - Row-level security / D1 equivalent via middleware
- **Interview Engine**
  - OpenRouter client with primary free model (`meta-llama/llama-3.1-8b-instruct:free`) + fallback (`mistralai/mistral-7b-instruct:free`)
  - System prompt covering 6 key areas: problem, users, features, tech, monetization, constraints
  - Adaptive loop: ask → receive → analyze coverage → decide next question or "Ready to generate?"
  - Session state persisted to D1 after every turn (resumable)
- **Document Generation**
  - Template registry: Roadmap, Spec/PRD, Kanban Backlog (3 templates)
  - Client-side PDF via `@react-pdf/renderer` (better layout control than jsPDF) or `pdfmake`
  - "Generate" button triggers PDF blob download
- **Dashboard**
  - List past interviews with status (in-progress, completed, exported)
  - Resume interview / view generated PDFs / delete
- **Deployment**
  - Vercel (Next.js) + Cloudflare D1 (via `@cloudflare/d1` or Workers binding)
  - CI: lint, typecheck, unit tests, preview deployments

### Success Criteria
- [ ] Anonymous user can sign up, start interview, answer ~10–15 questions, hit "Ready", pick 2 templates, download PDFs
- [ ] Interview resume works across browser sessions
- [ ] PDFs render correctly on desktop & mobile (A4/Letter)
- [ ] 0 server-side PDF generation cost
- [ ] Deployed on `app.domain.com` with custom domain

### Key Risks
| Risk | Mitigation |
|------|------------|
| OpenRouter free tier rate limits / model deprecation | Abstract model client; configurable fallback list; exponential backoff; monitor usage |
| D1 cold-start latency on first request | Keep Worker warm via cron ping; accept ~200ms first-hit penalty |
| Adaptive loop gets stuck / hallucinates "done" | Hard cap max questions (25); explicit coverage checklist in prompt; user "Ready" override always visible |
| Client-side PDF fonts / layout break on long content | Use `@react-pdf/renderer` with registered fonts; paginate programmatically; test with 200+ line backlogs |
| Supabase Auth + D1 session sync complexity | Store Supabase `user.id` as FK in D1; validate JWT in Next.js middleware |

---

## v1.0 (Month 2–3)
**Goal:** Polish, reliability, sharing, and richer outputs.

### Features
- **Interview UX**
  - Streaming responses (SSE) for perceived speed
  - "Re-ask" / "Skip" buttons per question
  - Progress sidebar showing coverage of 6 areas (checkmarks)
  - Voice input (Web Speech API) optional
- **Document Templates (+3)**
  - Lean Canvas, User Personas, Architecture Decision Record (ADR)
  - Template preview modal before PDF generation
- **Export & Share**
  - Copy markdown to clipboard
  - Public share link (read-only, expiring, no auth required)
  - Export to Notion (via API) / Linear / Jira (CSV)
- **Dashboard Enhancements**
  - Tags / folders for interviews
  - Search & filter
  - Duplicate interview as new starting point
- **Observability**
  - Vercel Analytics + custom events (interview_started, question_answered, pdf_generated)
  - OpenRouter usage dashboard (cost=0 but token tracking)
  - Error tracking (Sentry free tier)

### Success Criteria
- [ ] Median interview completion time < 15 min
- [ ] ≥ 3 templates used per user on average
- [ ] Share links work without login; expire after 30 days
- [ ] Zero critical bugs in production for 2 weeks

### Key Risks
| Risk | Mitigation |
|------|------------|
| Notion/Linear API rate limits or auth complexity | Build as background jobs (Vercel Cron + D1 queue table); retry with backoff |
| Streaming + D1 write race conditions | Write messages in batches; use `lastMessageId` for idempotency |
| Template maintenance burden | Template DSL (JSON schema + Handlebars) → easier to add new ones |

---

## v2.0 (Month 4–6)
**Goal:** Collaboration, intelligence, and platform extensibility.

### Features
- **Team Workspaces**
  - Invite members (Supabase orgs / custom invite flow)
  - Shared interview library, comments on messages
  - Role-based access (owner, editor, viewer)
- **AI Enhancements**
  - "Critique my idea" mode (adversarial follow-ups)
  - Auto-extract risks, assumptions, dependencies → separate document
  - Fine-tuned router: pick best free model per question type (technical vs. business)
- **Advanced Outputs**
  - Interactive roadmap (drag-drop Gantt via `dhtmlx-gantt` or `frappe-gantt`)
  - Live Notion/Linear sync (bi-directional)
  - Slide deck outline (Reveal.js export)
- **Billing & Limits (Prep for Pro)**
  - Usage quotas (interviews/month, PDFs/month)
  - Stripe integration skeleton (webhook → D1 entitlements)
- **Admin Panel**
  - User metrics, model performance, error rates

### Success Criteria
- [ ] 50+ active workspaces
- [ ] ≥ 30% of interviews use "Critique" or "Risk Extraction"
- [ ] Interactive roadmap used in > 20% of exports
- [ ] Stripe test mode end-to-end working

### Key Risks
| Risk | Mitigation |
|------|------------|
| Multi-tenant data isolation in D1 | `workspace_id` on every table; middleware enforcement; automated tests |
| Real-time collaboration conflict | Start with async (comments); CRDT/Yjs only if demand proven |
| Free model quality ceiling | Design prompt architecture to swap in paid models later without rewrite |

---

## Future Vision (Month 6+)
**Goal:** Become the default "idea → execution" workspace.

### Features
- **Agentic Workflows**
  - "Build me a starter repo" → generates Next.js + Supabase + Tailwind scaffold from spec
  - CI/CD pipeline YAML generation
  - Database migration files from data model section
- **Marketplace**
  - Community templates (industry-specific PRDs, compliance checklists)
  - Prompt packs for niche domains (SaaS, marketplace, AI wrapper, hardware)
- **Integrations Ecosystem**
  - GitHub Issues / Projects sync
  - Figma → design spec section
  - Slack / Discord bot: `/interview` starts DM flow
- **Intelligence Layer**
  - Benchmark your idea against public datasets (YC apps, IndieHacker posts)
  - "Find co-founders" matching based on complementary skills
- **Platform**
  - Public API for other tools to start interviews
  - White-label for accelerators / incubators

### Success Criteria
- [ ] 1,000+ monthly active users
- [ ] 10+ community templates published
- [ ] API used by ≥ 3 external products
- [ ] Revenue path validated (Pro tiers, marketplace rev-share, or B2B licenses)

### Key Risks
| Risk | Mitigation |
|------|------------|
| Scope creep / loss of focus | Quarterly OKRs; "no" by default; keep core loop fast |
| OpenRouter policy changes / free tier removal | Maintain BYOK (Bring Your Own Key) fallback; support local LLMs via Ollama |
| Competitor (Notion AI, Gamma, v0) embeds same flow | Double-down on *interview quality* and *developer-first outputs* (code, infra, CI) |

---

## Quick-Reference Timeline

| Phase | Weeks | Core Deliverable |
|-------|-------|------------------