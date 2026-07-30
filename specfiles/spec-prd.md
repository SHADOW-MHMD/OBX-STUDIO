# Product Requirements Document

## Executive Summary

**IdeaForge** is a web application that helps founders, product managers, and builders transform rough project ideas into structured, actionable documentation through an AI-powered adaptive interview. Users engage in a conversational discovery session with an LLM (via OpenRouter's free tier) that dynamically probes across six critical dimensions—problem, users, features, tech, monetization, and constraints—until sufficient coverage is achieved. The system then generates professional PDF documents (roadmap, spec, PRD, backlog, Kanban board) client-side, with full history persisted in a personal dashboard.

**Vision**: Eliminate the "blank page problem" for early-stage builders by replacing unstructured brainstorming with guided, intelligent discovery that produces investor-ready and team-ready artifacts.

**MVP Timeline**: 4–6 weeks to production on Vercel.

---

## Problem Statement

Early-stage builders face three interconnected problems:

1. **Incomplete Thinking**: Founders often over-index on features while neglecting distribution, monetization, or technical constraints. Unstructured note-taking misses blind spots.
2. **Documentation Overhead**: Converting raw notes into structured artifacts (PRDs, roadmaps, backlogs) is time-consuming and requires expertise many solo builders lack.
3. **No Continuity**: Ideas evolve across scattered notes, Notion pages, and voice memos. There's no single source of truth that captures the *reasoning* behind decisions.

Existing tools (ChatGPT, Notion AI, generic templates) fail because they:
- Don't enforce coverage across critical dimensions
- Don't maintain interview context across sessions
- Don't produce multiple document formats from one source of truth
- Require prompt engineering skill to get useful output

---

## Target Users & Personas

### Primary Persona: **Solo Founder / Indie Hacker** ("Alex")
- Building a SaaS or consumer app in nights/weekends
- Strong technical skills, weak product/marketing discipline
- Needs: Structure without bureaucracy, investor-ready docs for fundraising, handoff artifacts for first hires
- Pain: "I know what I'm building but can't articulate it clearly to others"

### Secondary Persona: **Product Manager at Early-Stage Startup** ("Priya")
- Validating new feature areas or pivot directions
- Needs: Stakeholder-aligned specs, engineering-ready backlogs, traceability from problem → solution
- Pain: "Discovery interviews are ad-hoc; specs get written post-hoc and miss context"

### Tertiary Persona: **Student / Career Switcher** ("Jordan")
- Building portfolio projects to demonstrate product thinking
- Needs: Guided practice in product discovery, polished artifacts for interviews
- Pain: "Tutorials teach code, not product strategy"

---

## Core Features (with Priority)

### P0 — Must Have for Launch

| Feature | Description |
|---------|-------------|
| **Adaptive AI Interview** | LLM conducts multi-turn conversation covering 6 dimensions (problem, users, features, tech, monetization, constraints). Dynamically follows up on gaps. Tracks coverage state server-side. |
| **Completion Gate** | When coverage threshold met, AI presents: "Ready to generate?" or "I need more info on [area]". User confirms or continues. |
| **Document Generation Engine** | Client-side PDF generation (jsPDF/pdfmake) from structured interview data. Templates: Roadmap, Spec, PRD, Backlog, Kanban Board. User selects 1+ from menu. |
| **Supabase Auth + Dashboard** | Email/password + GitHub/Google OAuth. Protected routes. Dashboard lists all interviews with status (In Progress, Complete, Documents Generated). |
| **Cloudflare D1 Persistence** | Interview transcripts, coverage state, generated documents metadata, user preferences stored in D1 via Supabase edge functions or Workers. |
| **OpenRouter Integration** | Primary free model (e.g., `meta-llama/llama-3.1-8b-instruct:free`) with automatic fallback to secondary free model on rate limit / error. Streaming responses. |

### P1 — High Value, Post-Launch (Weeks 5–8)

| Feature | Description |
|---------|-------------|
| **Template Customization** | User edits section visibility, adds custom sections, saves as personal template. |
| **Export Integrations** | "Push to Notion", "Create Linear issues", "Export to GitHub Projects" via OAuth. |
| **Interview Resume** | Pause mid-interview, return later with full context preserved. |
| **Team Workspaces** | Invite collaborators, shared interview library, comment threads on generated docs. |

### P2 — Nice to Have

| Feature | Description |
|---------|-------------|
| **Analytics Dashboard** | Coverage heatmap, time-to-complete, most-common gaps across user base. |
| **Voice Input** | Web Speech API for hands-free interviewing. |
| **Public Showcase** | Opt-in gallery of anonymized roadmaps/PRDs for inspiration. |
| **Multi-language Support** | Interview + docs in Spanish, French, Japanese, etc. |

---

## User Stories

### Epic: Adaptive Interview

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| INT-1 | As a user, I can start a new interview so that I begin structuring my idea. | Clicking "New Interview" opens chat interface with AI greeting + first question. |
| INT-2 | As a user, I receive follow-up questions adapted to my previous answers so that gaps are filled. | AI references prior answers. No repeated questions. Coverage state updates per dimension. |
| INT-3 | As a user, I see visual progress across the 6 dimensions so that I know what's covered. | Progress indicator (6 segments) updates in real-time. Hover shows dimension name + status. |
| INT-4 | As a user, I am prompted when the AI believes coverage is sufficient so that I can decide to generate. | Modal: "I have enough to generate your documents. Ready?" with "Generate" / "Continue Interview" buttons. |
| INT-5 | As a user, I can request more depth on a specific area so that weak sections improve. | "I need more info" button opens sub-menu of 6 dimensions; selecting one triggers targeted follow-ups. |

### Epic: Document Generation

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| DOC-1 | As a user, I select document types from a menu so that I get only what I need. | Checklist modal: Roadmap, Spec, PRD, Backlog, Kanban. Multi-select. "Generate PDFs" button. |
| DOC-2 | As a user, I receive professionally formatted PDFs so that I can share them immediately. | Each PDF: cover page, TOC, structured sections, page numbers, consistent typography. Downloads as ZIP or individual files. |
| DOC-3 | As a user, I can regenerate documents after continuing the interview so that docs stay current. | "Regenerate" button on dashboard re-runs generation with latest interview data. |

### Epic: Dashboard & History

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| DASH-1 | As a user, I see all my interviews in a dashboard so that I can resume or review. | Table: Project Name, Status, Last Updated, Document Count. Sortable, searchable. |
| DASH-2 | As a user, I can rename/delete interviews so that I manage my workspace. | Inline rename. Delete shows confirmation modal. Soft delete (30-day recovery). |
| DASH-3 | As a user, I can view full transcript and generated docs for any completed interview. | Click row → detail view with tabbed interface: Transcript / Documents / Coverage Map. |

### Epic: Auth & Settings

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| AUTH-1 | As a user, I sign up via email/password or GitHub/Google so that I access my data anywhere. | Supabase Auth flow. Email verification required. OAuth auto-links if email matches. |
| AUTH-2 | As a user, I manage account settings (name, avatar, password, connected accounts). | Settings page with Supabase user metadata. Delete account option (c