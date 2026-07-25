# OBX-STUDIO — App Specification

> AI-powered idea interview tool for broke indie devs & students.
> Grills you about your app idea and spits out a full spec, roadmap, and kanban board.

---

## 1. What It Does

A conversational AI interviewer that extracts a complete app idea from a user's head through dynamic Q&A, then generates structured output documents (PRD, roadmap, tech stack, task breakdown). Targeted at student indie devs who are stuck on what to build.

---

## 2. Core User Flow

```
Landing Page → Sign Up / Log In → Dashboard → Start New Interview
  → AI asks one question at a time (streamed, with multiple-choice options)
  → User answers via text OR selects from AI-suggested options
  → AI summarizes answers dynamically, asks next relevant question
  → AI decides when it has enough → prompts user to pick output type
  → Output generated (full response, not streamed)
  → User views rendered markdown + copy + export (.md / .pdf)
  → Kanban board auto-populated from AI task breakdown
  → Session saved to localStorage (D1 sync = future paid feature)
```

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React + TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend/API | Next.js API Routes → deployed as CF Workers via `@cloudflare/next-on-pages` |
| Database | Cloudflare D1 (SQLite) |
| Auth | Supabase Auth (JWT) — GitHub, Google, Email+Password |
| AI | OpenRouter free model tier (e.g. `meta-llama/llama-3.1-8b-instruct:free`) |
| Hosting | Cloudflare Pages (frontend) + Cloudflare Workers (API) |
| Source | Open source (code public, `.env` / deployment private) |

> **Cost: $0** — CF Pages/Workers free tier + Supabase free tier (50k MAU) + OpenRouter free models.

---

## 4. AI Interview Engine

- **Mode**: Hybrid — full chat history compressed into a rolling summary, AI asks the next most relevant question
- **Question format**: One question at a time, streamed token-by-token
- **Answer format**: Text input + AI-generated multiple-choice options (user picks or types)
- **Depth**: Dynamic — AI decides when it has enough context to generate output
- **System prompt**: Tuned to extract: problem, users, features, tech constraints, monetization, MVP scope
- **Model**: OpenRouter free tier, auto-routed to best available free model

---

## 5. Output System

At the end of the interview, user picks what to generate:

| Option | Description |
|---|---|
| 1 | Full PRD (Product Requirements Document) |
| 2 | Simple bullet-point summary |
| 3 | Roadmap (MVP → v1 → v2) |
| 4 | Tech stack + architecture plan |
| 5 | All of the above |

- Output rendered as **beautiful formatted markdown**
- **Copy to clipboard** button
- **Export** as `.md` file download
- **Export** as `.pdf` file download
- Kanban board **auto-populated** from AI task breakdown (part of every output)

---

## 6. Kanban Board

- Auto-populated from the AI-generated task breakdown
- Drag-and-drop: **To Do / In Progress / Done**
- Linked to each interview/project
- Persisted in localStorage (paid: D1 sync)

---

## 7. Authentication

- Provider: **Supabase Auth**
- Methods: **GitHub OAuth**, **Google OAuth**, **Email + Password**
- JWT passed to CF Workers API routes for identity verification
- Required — no anonymous usage

---

## 8. Data & Storage

| Tier | Storage |
|---|---|
| Free | localStorage only (session history, kanban state) |
| Paid (future) | Cloudflare D1 sync (cross-device, persistent backup) |

**D1 Schema (planned):**
- `users` — user id, supabase uid, tier, token_bucket, streak, created_at
- `interviews` — id, user_id, title, status, created_at, updated_at
- `messages` — id, interview_id, role, content, created_at
- `outputs` — id, interview_id, type, content, created_at
- `kanban_items` — id, interview_id, title, status, position

---

## 9. Rate Limiting (Token Bucket)

- **Free tier**: ~1,000 tokens/day per account (enforced in CF Workers)
- Tracked in D1 `users` table, reset daily via CF Cron Trigger
- Soft limit: show warning at 80% usage
- Hard limit: block interview start, show upgrade prompt (no payment yet — "coming soon")

---

## 10. Dashboard

Shown to logged-in users on landing:

**Stats cards:**
- Total interviews completed
- Daily token usage (X / 1000 used today)
- Ideas by status (interview done / kanban started / etc.)
- Streak (days active)
- Total questions answered

**Main content:**
- List of past interviews with title, date, status, output type
- Each card: Resume / View Output / Open Kanban buttons
- Primary CTA: **"Start New Interview"** button

---

## 11. Admin Panel

Accessible to admin accounts only. Shows:

- Total registered users
- Active users today / this week
- Interviews started vs completed (funnel)
- Token usage across all users (aggregate + per-user top consumers)
- Most popular output types
- Flagged abuse / rate-limit hits

---

## 12. Mobile Handling

- **Desktop-only app** for now (beta)
- On mobile: polite full-screen message — *"OBX-STUDIO is currently in beta. Mobile support is coming soon."*
- Code architecture: separate component files
  - `src/components/desktop/` — rendered only on desktop sessions
  - `src/components/mobile/` — rendered only on mobile (currently just the polite refusal)
- Detection: `navigator.userAgent` / viewport width check at root layout level

---

## 13. Landing Page

- Public, no login required
- Explains what OBX-STUDIO does
- Hero section with screenshot/demo
- Features section
- CTA: Sign up / Log in
- Vercel-style aesthetic: full black, white accents, sharp shadows, clean typography

---

## 14. Visual Design

- **Theme**: Vercel-inspired — full black background, white text, white accents
- **Typography**: Inter or Geist (Vercel's font)
- **Components**: shadcn/ui (dark mode)
- **Effects**: subtle shadows, border highlights, minimal animations
- **No color gimmicks** — monochrome with occasional accent highlights

---

## 15. Open Source Strategy

- Code published to GitHub (MIT or similar)
- `.env` and deployment credentials stay private
- Your hosted instance at `obx-studio.com` (or CF Pages domain) runs with your keys
- Self-hosters bring their own OpenRouter key + Supabase + CF account

---

## 16. MVP Scope (Ship This First)

- [ ] Landing page
- [ ] Auth (Supabase: GitHub + Google + email)
- [ ] AI interview flow (streaming questions + multiple-choice options)
- [ ] Output generation (user picks type, full response)
- [ ] Rendered markdown output + copy + .md/.pdf export
- [ ] Kanban board (auto-populated, drag-and-drop)
- [ ] Dashboard (stats + interview history)
- [ ] localStorage persistence
- [ ] Token bucket rate limiting (free tier)
- [ ] Mobile block screen
- [ ] Admin panel

---

## 17. Deferred (Post-MVP)

- Payment integration (Stripe / LemonSqueezy)
- D1 sync for paid users
- Public shareable links for outputs
- Share to Twitter/X
- More tools in OBX-STUDIO suite

---

## 18. Key Decisions Summary

| Decision | Choice | Ceiling / Note |
|---|---|---|
| AI key | Shared app key | ponytail: user brings own key is upgrade path if abuse |
| Storage | localStorage | ponytail: D1 sync behind paid flag when ready |
| Payments | Skipped for MVP | ponytail: add Stripe when subscription model is defined |
| Sharing | Deferred | ponytail: public link via D1 row + public flag |
| Mobile | Block screen | ponytail: proper responsive layout when time allows |

