# App Idea Summary

## What It Does
An interactive AI interviewer that guides solo founders through a structured multi-turn conversation to extract hidden requirements, apply architecture guardrails, and output tool-specific structured specs (JSON/MD) ready for AI coding agents. Uses prompt engineering to make small models interview like pros, with a 2D neural canvas visualizing the plan as connected nodes.

## Who It's For
**Solo founders / indie hackers** who build with AI coding tools (Cursor/Copilot, v0, Bolt, Lovable) but waste cycles on vague prompts, 10+ iteration loops, or messy specs that agents can't execute cleanly.

## Core Features
- **Multi-turn interview logic** — extracts requirements founders don't know they need
- **Architecture guardrails** — built-in best-practice patterns prevent design disasters
- **Tool-tailored output schemas** — specs formatted for Cursor, v0, Bolt, Lovable
- **BYOK + model selection** — users bring OpenRouter key, pick any model (Nemotron, etc.)
- **2D neural canvas** — nodes + connections for pain points, ideas, features; live preview
- **Sliding context window** — 12 messages / 6 turns with canvas state serialized
- **Auto-cleanup** — inactive projects deleted after set period to control D1 growth

## Tech Stack
| Layer | Choice |
|-------|--------|
| **Frontend** | Next.js (App Router) on Cloudflare Pages |
| **Backend** | Cloudflare Workers + Hono (ultra-low latency) |
| **Database** | Cloudflare D1 (serverless SQLite at edge) |
| **Auth** | Supabase Auth + `jose` library (edge-native JWKS caching) |
| **Async writes** | `ctx.waitUntil()` fire-and-forget D1 inserts |

## MVP Scope
- **Free, open-source, self-hosted on Cloudflare** — zero monetization, zero AI cost (BYOK)
- **Single dynamic system prompt + conversation history** — ~4k tokens at turn 20
- **Anonymous-by-default** — Supabase Auth only for project ownership, not required to start
- **Core loop**: interview → canvas → spec export → hand off to agent
- **Maintenance only**: Cloudflare bill + auto-prune stale sessions