# Product Roadmap

## MVP (Week 1-4)
**Goal**: Core interviewer loop working end-to-end — founder lands, authenticates, runs a planning session, gets a usable spec.

### Features
- [ ] Next.js + Hono + D1 + Supabase Auth deployed to Cloudflare Pages/Workers
- [ ] Auth flow: Supabase email/password + OAuth (GitHub), JWT verification via `jose` with cached JWKS
- [ ] Interview engine: single dynamic system prompt + 12-message sliding window, canvas state serialized into prompt
- [ ] Multi-phase interview logic (discovery → requirements → architecture → spec) with guardrails injected per phase
- [ ] Output generation: structured JSON + Markdown spec, downloadable/copyable
- [ ] Tool-target selector: Cursor, v0, Bolt, Lovable — adjusts output schema per target
- [ ] BYOK integration: OpenRouter key input, model selector (user's available models)
- [ ] Session persistence: D1 writes via `ctx.waitUntil()`, auto-delete unused projects after 30 days
- [ ] Basic UI: chat interface, canvas preview (read-only), spec output view
- [ ] Open source repo with MIT license, self-host docs

### Success Criteria
- [ ] 50+ unique founders complete a full interview → spec in week 4
- [ ] Median interview duration < 15 minutes, ≤ 12 turns
- [ ] Spec output passes "compile check" — pasting into target tool produces runnable scaffold without hallucinated deps
- [ ] P95 Worker latency < 800ms per turn (excluding LLM latency)
- [ ] Zero D1 write errors under load test (100 concurrent sessions)

### Key Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Prompt quality insufficient for small models | Medium | High | A/B test prompt variants; log failure patterns; iterate weekly |
| Supabase Auth cold-start latency on Workers | Low | Medium | Pre-warm JWKS cache; monitor `cf-workers` metrics |
| D1 auto-cleanup deletes active sessions | Low | High | TTL based on `updated_at`; grace period + email notice (optional) |
| BYOK key invalid/rate-limited mid-session | Medium | Medium | Validate key upfront; surface provider errors clearly |

---

## v1.0 (Month 2-3)
**Goal**: Polish the core loop, add differentiation features, grow organic adoption.

### Features
- [ ] **Canvas visualization**: interactive 2D node graph (pain points, requirements, architecture decisions, spec sections) — zoom, pan, click to edit
- [ ] **Prompt engineering moat v2**: router + micro-prompts per stage (replaces single prompt) — improves small-model reliability
- [ ] **Template library**: community-contributed starter interviews (SaaS, marketplace, CLI tool, Chrome extension, etc.)
- [ ] **Export integrations**: one-click "Open in Cursor", "Open in v0", "Download Bolt prompt", "Copy Lovable prompt"
- [ ] **Session branching**: fork at any turn, explore alternative architectures
- [ ] **Usage analytics (anon)**: turn count, drop-off phase, model used, target tool — stored in D1, no PII
- [ ] **Dark mode, keyboard shortcuts, accessibility audit**
- [ ] **Documentation site**: prompt architecture guide, self-hosting, contributing

### Success Criteria
- [ ] 500+ monthly active users (completed interviews)
- [ ] ≥ 30% return rate (users run ≥ 2 interviews)
- [ ] Community contributes ≥ 10 templates
- [ ] Small models (Nemotron 55B, Llama 3.1 70B) achieve ≥ 85% spec quality vs. Opus/GPT-4o baseline
- [ ] Zero critical bugs open > 48 hours

### Key Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Canvas visualization perf on mobile | Medium | Medium | Virtualized rendering; lazy-load; fallback to list view |
| Prompt router adds complexity/latency | Medium | Medium | Benchmark vs. single prompt; feature flag rollout |
| Template quality variance | High | Low | Curated "official" templates + community voting |
| Scope creep from feature requests | High | Medium | Public roadmap; "not now" label; stay focused on interview quality |

---

## v2.0 (Month 4-6)
**Goal**: Expand beyond planning — become the *spec layer* for AI app development.

### Features
- [ ] **Spec versioning & diff**: git-like history for specs, compare versions, rollback
- [ ] **Team workspaces (optional)**: shared projects, comments, review workflow — still free, still BYOK
- [ ] **Agent handoff protocol**: standardized `agent-spec.json` schema + CLI tool (`npx @yourname/spec-runner`) that feeds spec to Cursor/v0/Bolt programmatically
- [ ] **Live preview**: render spec as interactive mockup (Storybook-style) using v0/Lovable API or local Next.js sandbox
- [ ] **Plugin system**: community prompt packs for domains (auth, payments, realtime, AI features, etc.)
- [ ] **Multi-model interview**: different models per phase (cheap for discovery, strong for architecture)
- [ ] **Telemetry dashboard (opt-in)**: model performance, token costs, spec success rates — helps users pick models
- [ ] **VS Code extension**: `@spec` chat participant reads local `agent-spec.json`, suggests code edits

### Success Criteria
- [ ] 2,000+ MAU
- [ ] ≥ 50 community prompt packs published
- [ ] `agent-spec.json` adopted by ≥ 2 external tools/frameworks
- [ ] VS Code extension ≥ 1,000 installs
- [ ] Median spec-to-working-app time < 30 minutes (user-reported)

### Key Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Agent handoff protocol fragmentation | High | High | Lead a spec RFC; publish TypeScript types; court tool maintainers |
| Live preview scope creep | Medium | High | Scope to read-only mockup v1; defer interactive sandbox |
| Team workspaces → auth complexity | Medium | Medium | Keep optional; reuse Supabase; no billing ever |
| Maintainer burnout (solo, free) | High | High | Recruit 2-3 core contributors; automate releases; documented onboarding |

---

## Future Vision (Year 2+)
**Goal**: The universal planning layer for human-AI software development.

### Strategic Directions
- **Spec-as-code ecosystem**: `agent-spec.json` becomes a standard — CI/CD pipelines validate specs, generate tests, deploy preview environments
- **Enterprise adoption**: Self-hosted air-gapped version for regulated industries (HIPAA, SOC2) — paid support tier funds the free tier
- **AI model marketplace integration**: Dynamic model routing based on task (planning → reasoning model, coding → coding model) with cost/quality transparency
- **Learning loop**: Anonymous opt-in telemetry trains a "planner critic" model that scores specs pre-generation, suggests improvements
- **Education integration**: "Learn to spec" mode for junior devs/bootcamps — guided interviews with explanations
- **Multi-player real-time**: Collaborative planning sessions with cursors, presence, voice notes — still local-first, WebRTC optional

### Success Metrics (Year 2)
- 50,000+ MAU
- `agent-spec.json` referenced in ≥ 