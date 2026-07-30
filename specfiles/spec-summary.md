# App Idea Summary

## What It Does
An AI-powered web app that conducts adaptive, conversational interviews to help users flesh out their app or project ideas. The AI dynamically asks follow-up questions across key areas (problem, users, features, tech, monetization, constraints) until coverage is sufficient, then generates structured planning documents—roadmaps, specs, PRDs, backlogs, Kanban boards—as downloadable PDFs.

## Who It's For
- Founders & indie hackers validating new product ideas
- Product managers drafting initial specs
- Developers & students planning side projects
- Anyone who wants structured planning artifacts without starting from a blank page

## Core Features
- **Adaptive AI Interview**: OpenRouter free-tier model asks contextual follow-ups until all key areas are covered
- **Completion Gate**: AI prompts "Ready to generate?" / "Need more info" before document creation
- **Multi-Template Document Generation**: User selects from Roadmap, Spec, PRD, Backlog, Kanban (extensible)
- **Client-Side PDF Export**: jsPDF/pdfmake — zero server cost, instant download
- **Full Auth & History**: Supabase Auth (email/password + GitHub/Google OAuth), persistent dashboard with past interviews & generated docs
- **Fallback Model Strategy**: Primary free model + automatic fallback on rate limits

## Tech Stack
| Layer | Choice |
|-------|--------|
| **Framework** | Next.js (App Router) + React + TypeScript |
| **Styling** | Tailwind CSS |
| **Hosting** | Vercel (serverless) |
| **Auth** | Supabase Auth |
| **Database** | Cloudflare D1 (SQLite) |
| **AI** | OpenRouter API (free tier models with fallback) |
| **PDF** | jsPDF or pdfmake (client-side) |

## MVP Scope (4–6 Weeks)
1. **Core Interview Engine** – Adaptive loop with completion detection
2. **3+ Document Templates** – Roadmap, Spec/PRD, Kanban/Backlog
3. **Auth & Dashboard** – Supabase Auth, interview history, doc re-generation
4. **PDF Export** – Client-side generation, polished styling
5. **Model Resilience** – Primary + fallback free model handling
6. **Deploy & Polish** – Vercel deploy, responsive UI, error states, basic analytics