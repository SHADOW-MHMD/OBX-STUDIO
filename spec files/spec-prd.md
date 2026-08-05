# Product Requirements Document

## Executive Summary

**App Name:** Agent Spec Planner (working title)  
**Type:** Open-source, free-to-use web application  
**Core Value:** Transforms vague founder intent into structured, agent-ready specifications (JSON/Markdown) through an AI-powered interactive interview — enabling solo founders to hand off precise requirements to AI coding tools (Cursor, v0, Bolt, Lovable) and get working code in fewer iterations.

**Strategic Positioning:** The "missing planning layer" between human intent and AI execution. Not a code generator — a *spec generator* that makes any model (including small/cheap ones) interview like a senior product architect.

**Delivery Model:**  
- Web app (standalone planning session)  
- BYOK (Bring Your Own Key) via OpenRouter — users choose their model, pay their own inference costs  
- Hosted on Cloudflare Workers + Pages (zero infra cost to maintain)  
- Open source (MIT/Apache 2.0) — community extensible  

**Key Moat:** Prompt engineering architecture that makes small models (Nemotron 55B, etc.) extract hidden requirements, enforce architecture guardrails, and emit tool-specific specs — without fine-tuning.

---

## Problem Statement

### Primary Pain Point
**Solo founders and indie hackers cannot effectively translate product vision into specifications that AI coding agents can execute reliably.**

### Current Failure Modes
| Workaround | Why It Fails |
|------------|--------------|
| **Copy-paste prompt templates** | Rigid; don't adapt to project nuance; miss hidden requirements (auth, rate limits, schema migrations, error boundaries) |
| **Iterative prompt refinement (10+ turns)** | Expensive (time + tokens); context drifts; founders don't know what to ask for; agents hallucinate architecture decisions |

### Root Cause
Humans think in *outcomes* and *features*. Agents need *precise, structured, context-complete specifications* — including data models, API contracts, state management, error handling, and deployment topology. The translation gap causes rework, broken builds, and abandoned projects.

### Why Now
- AI coding tools (Cursor, v0, Bolt, Lovable) have lowered *build* barrier but not *spec* barrier
- Solo founders are the fastest-growing segment of AI-assisted builders
- Model costs dropping (BYOK viable); small models now capable with strong prompt engineering
- No existing tool focuses *exclusively* on the planning → spec handoff for this persona

---

## Target Users & Personas

### Primary Persona: **Solo Founder / Indie Hacker**
| Attribute | Detail |
|-----------|--------|
| **Role** | Founder, builder, PM, designer, dev — all at once |
| **Time Budget** | 10–20 hrs/week on product; cannot afford 5+ hours of prompt engineering |
| **Stack** | Cursor/Copilot (IDE) **or** v0/Bolt/Lovable (prompt-to-app) — often both |
| **Pain** | "I know what I want but the agent keeps building the wrong thing" |
| **Goal** | One planning session → clean spec → working prototype in 1–2 agent runs |
| **Willingness to Pay** | $0 (budget-constrained); will invest time in a free tool that saves hours |
| **Technical Fluency** | Can read code, write basic prompts, but not a prompt engineer |

### Secondary Personas (Future)
- **Agencies** building for clients — need repeatable spec process
- **PMs at startups** — want to hand off crisp specs to dev/agent teams
- **Enterprise innovation labs** — need governance + audit trail on AI-generated specs

---

## Core Features (with Priority)

### P0 — Must Have for MVP
| ID | Feature | Description |
|----|---------|-------------|
| **F1** | **Interactive Interview Engine** | Multi-turn conversation that progressively elicits: problem, users, features, data models, API contracts, auth, deployment, edge cases. Uses single dynamic system prompt + 12-message sliding window. |
| **F2** | **Canvas-Backed Context** | 2D neural canvas (nodes = pain points, ideas, features, decisions; edges = relationships). Serialized into prompt context each turn. Visual preview of spec structure. |
| **F3** | **Architecture Guardrails** | Built-in best-practice patterns injected during interview: "Add idempotency keys for webhooks," "Use optimistic UI for mutations," "Plan for schema migrations." Prevents rookie architecture mistakes. |
| **F4** | **Tool-Specific Output Schemas** | Export spec as JSON/MD tailored to target: <br>• **Cursor/Copilot**: `SPEC.md` + `ARCHITECTURE.md` + task breakdown <br>• **v0/Bolt/Lovable**: Feature list + component hierarchy + data flow + prompt-ready blocks |
| **F5** | **BYOK + Model Selector** | User provides OpenRouter key; selects model (Nemotron 550B, 55B MoE, Claude, GPT-4o, etc.). Zero cost to operator. |
| **F6** | **Session Persistence & Resume** | D1-backed sessions; founder can pause, return, continue interview. Auto-delete unused projects after 30 days (configurable). |
| **F7** | **Auth (Supabase + `jose`)** | Email/password + OAuth (GitHub, Google). JWT verified in Workers via cached JWKS. No session server needed. |

### P1 — High Value, Post-MVP
| ID | Feature | Description |
|----|---------|-------------|
| **F8** | **Spec Versioning & Diff** | Track spec evolution; compare versions; rollback. |
| **F9** | **Team Collaboration (Read-only Share)** | Share spec link with co-founder/contractor; comment mode. |
| **F10** | **Template Library** | Community-contributed starter interviews (SaaS, Marketplace, AI Wrapper, Chrome Extension, etc.). |
| **F11** | **Agent Execution Tracker** | Link spec → agent run (Cursor/v0) → outcome; close the loop for learning. |
| **F12** | **CLI Companion** | `npx spec-planner init` → local interview → push to web for review. |

### P2 — Nice to Have / Experimental
| ID | Feature | Description |
|----|---------|-------------|
| **F13** | **Multi-Model Consensus** | Run interview with 2+ models; flag disagreements for human review. |
| **F14** | **Spec-to-Test Generation** | Output Playwright/Cypress test specs from acceptance criteria. |
| **F15** | **Cost Estimation** | Estimate agent runs + token costs before build. |
| **F16** | **Plugin System** | Custom guardrails, output formats, interview phases via JS/TS plugins. |

---

## User Stories

### Epic 1: Plan a New App
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-1.1 | As a solo founder, I want to start a new planning session so that I can define my app idea from scratch. | •