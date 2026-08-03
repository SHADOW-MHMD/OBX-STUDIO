# OBX-STUDIO — Implementation Plan
> Generated: 2026-08-02 | Based on full codebase analysis + 18-question owner interview

---

## Executive Summary

This plan covers **4 parallel tracks** to be executed simultaneously:
1. **Track A — Critical Bug Fixes** (blockers, data integrity)
2. **Track B — UI/UX Redesign** (landing page, dashboard, all pages)
3. **Track C — New Features** (share, templates, search, integrations)
4. **Track D — Infrastructure** (voice, canvas persistence, email, changelog)

**Design Direction:** Vercel/Linear aesthetic — ultra-clean, monochrome black/white with subtle fade-in + slide-up animations and hover effects on all interactive cards.

---

## Track A — Critical Bug Fixes

### A1. Schema Drift Fix 🔴 CRITICAL
**Files:** `obx-backend/schema.sql`, new `obx-backend/alter-schema-3.sql`

The `schema.sql` is missing columns that are actively used:
- `interviews.persona` — INSERT fails without this column
- `users.openrouter_key` — used in auth middleware + settings
- `users.openrouter_model` — used in settings
- `users.theme_accent` — used in settings + AuthProvider

**Fix:** Create `alter-schema-3.sql`:
```sql
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS persona TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS openrouter_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS openrouter_model TEXT DEFAULT 'nvidia/nemotron-ultra-253b-v1:free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_accent TEXT DEFAULT 'cyan';
```
Update `schema.sql` to reflect the full correct current state.

---

### A2. Daily Interview Limit Enforcement 🔴 CRITICAL
**File:** `obx-backend/src/routes/interview.ts`

`POST /interview` increments `interviews_used_today` but NEVER checks against `interviews_limit`.
Users can create unlimited interviews.

**Fix:** Add before creating interview:
```typescript
if (dbUser.interviews_used_today >= dbUser.interviews_limit) {
  return c.json({ error: 'Daily limit reached', code: 'RATE_LIMITED' }, 429);
}
```

---

### A3. useSupabaseCanvas Real-time Broadcast Fix 🔴 CRITICAL
**File:** `frontend/src/hooks/useSupabaseCanvas.ts`

`supabase.channel()` inside callbacks creates a NEW unsubscribed channel each time — broadcast never fires.

**Fix:** Store the subscribed channel in a `useRef` and reuse it in callbacks:
```typescript
const channelRef = useRef<RealtimeChannel | null>(null);
// useEffect: channelRef.current = supabase.channel(`canvas-${id}`).subscribe()
// callbacks: channelRef.current?.send({ ... })
```

---

### A4. Toast System — Replace All alert() Calls 🟠 HIGH
**New files:** `frontend/src/components/ui/Toast.tsx`, `frontend/src/hooks/useToast.ts`

`alert()` is used 8+ times across the app for success/error feedback.

**Fix:**
- Create a lightweight Zustand-backed toast stack with slide-in animation
- 3 variants: `success` (green border), `error` (red border), `info` (white border)
- Auto-dismiss after 3 seconds
- Add `<Toaster />` to `layout.tsx`
- Replace every `alert()` call across dashboard, settings, interview pages

---

### A5. Kanban Double-Write Race Condition Fix 🟠 HIGH
**Files:** `frontend/src/app/kanban/[id]/page.tsx`, `obx-backend/src/routes/kanban.ts`

Adding a task to non-"todo" columns requires 2 sequential API calls — race condition if 2nd fails.

**Fix:** Update `POST /kanban/:interviewId/item` to accept `status` body field. Eliminate the double-write on the frontend.

---

### A6. Auth Callback Robustness Fix 🟠 HIGH
**File:** `frontend/src/app/auth/callback/page.tsx`

1500ms hardcoded timeout is fragile. No error handling for denied OAuth.

**Fix:** Remove timeout. Rely on `onAuthStateChange`. Add error state for denied/failed OAuth with "Go back" button.

---

### A7. AuthProvider Double API Call Fix 🟡 MEDIUM
**File:** `frontend/src/components/providers/AuthProvider.tsx`

`api.auth.me()` called twice on mount (getSession + INITIAL_SESSION event both trigger syncUser).

**Fix:** Add `hasSynced` ref, skip duplicate calls for same session token.

---

### A8. Fix .md Export Reliability 🟠 HIGH
**File:** `frontend/src/lib/utils.ts`

PDF renders raw markdown. Decision: deprioritize PDF, fix `.md` export.

**Fix:**
- Append `<a>` to DOM before `.click()` (browser compatibility)
- Add `.txt` fallback if Blob API fails
- Sanitize filename from interview title (strip invalid chars)

---

### A9. Consolidate Mobile Block 🟡 MEDIUM
**Files:** `frontend/src/app/output/[id]/page.tsx`, `frontend/src/app/kanban/[id]/page.tsx`, `frontend/src/components/layout/MobileBlock.tsx`

Output and Kanban pages inline-duplicate mobile blocking logic.

**Fix:** Remove inline mobile detection from both files (MobileBlock in layout.tsx already covers it). Delete dead `isMobile()` function from MobileBlock.tsx.

---

### A10. Navbar Dropdown Hover Gap Fix 🟡 MEDIUM
**File:** `frontend/src/components/layout/Navbar.tsx`

CSS `group-hover` closes dropdown when mouse crosses the gap between avatar and dropdown.

**Fix:** Replace with JS `useState(false)` toggle + click-outside listener (`useEffect`). Add Escape key to close. Remove unused `LayoutDashboard` import.

---

### A11. Unused Imports Cleanup 🔵 LOW
- `Navbar.tsx`: Remove `LayoutDashboard`
- `admin/page.tsx`: Remove `ChevronDown`, `MessageSquare`
- `MobileBlock.tsx`: Remove dead `isMobile()` function
- `package.json`: Note that `html2canvas` and `recharts` are "planned" (recharts used in B3)

---

## Track B — UI/UX Redesign

### B1. Global Design System Upgrade
**File:** `frontend/src/app/globals.css`

- Replace `@import url(Google Fonts)` with `next/font/google` (`Inter`, `--font-inter`)
- Add CSS animations: `fadeInUp` (cards/sections), `slideInRight` (toasts), `scaleIn` (modals)
- Add `transition: all 0.15s ease` on all interactive elements
- Add `.card` utility: `background: #080808; border: 1px solid #1a1a1a; border-radius: 12px; &:hover { border-color: #333; }`
- Improve `.btn-primary` contrast for all accent colors

---

### B2. Landing Page Full Redesign
**File:** `frontend/src/app/page.tsx`

**Hero Section:**
- Animated gradient text (CSS keyframe: white → gray → white cycle)
- Floating dashboard mockup screenshot with subtle float animation
- Better badge with pulsing green dot (live indicator)

**New: Testimonials Section**
- 3 placeholder quote cards from "indie dev" personas
- Staggered fade-in-up via Intersection Observer

**New: Pricing Section**
- Free tier card (current limits) + "Pro — Coming Soon" card
- "Join waitlist" CTA for pro tier

**New: Demo Section**
- Animated terminal/chat mockup (pure CSS + JS) simulating an AI Q&A exchange

**Footer:** Add GitHub, Status, Terms, Privacy links

---

### B3. Dashboard Full Redesign
**File:** `frontend/src/app/dashboard/page.tsx`

- Two-column layout: main content (70%) + quick stats sidebar (30%)
- Animated number counters on stat cards
- **Recharts charts:**
  - 7-day bar chart: interviews per day (from `created_at` grouped by date)
  - Donut chart: Kanban item status breakdown (To Do / In Progress / Done)
- Interview list: search bar (client-side), filter tabs (All | In Progress | Completed), pagination (10/page)
- Interview card: hover lift + border animation, "Duplicate" action (C7), template badge
- Replace all `alert()` with toasts

---

### B4. Interview Page UI Improvements
**File:** `frontend/src/app/interview/[id]/page.tsx`

- Fix `handleSend` deps: add `nodes`, `edges` to dependency array
- Add Skip + Re-ask buttons on AssistantBubble (C3)
- Better bubble styling: subtle left border accent on AI messages
- Character count in input area
- Loading skeleton while data loads
- Fix stale canvas state

---

### B5. Output Page UI Improvements
**File:** `frontend/src/app/output/[id]/page.tsx`

- Better tab design for multiple output types
- Custom `.prose` styles for rendered code blocks, tables, blockquotes
- Add "Copy for Notion" button (C5)
- Fix "Add Format" — preserve existing tabs before adding new format
- Remove inline mobile block (A9 handles this)

---

### B6. Kanban Board UI Improvements
**File:** `frontend/src/app/kanban/[id]/page.tsx`

- Column headers with card count badges
- Cards: description preview (2-line truncate), status color dots
- Animated drag handle (opacity 0→1 on hover)
- Empty column state with placeholder text
- 5-second undo snackbar on delete
- Fix double-write race (A5), fix autofill dedup (D4)
- Remove inline mobile block (A9)

---

### B7. Settings Page UI Improvements
**File:** `frontend/src/app/settings/page.tsx`

- Replace all `alert()` with toasts
- OpenRouter key format validation (must match `sk-or-v1-...`)
- Model ID validation (regex for `provider/model-name[:variant]` pattern)
- Add "Delete Account" section with confirmation modal (C6)
- Add "Export My Data" button (C6)
- Fix input fields to use `.input` CSS class (consistency)

---

### B8. Admin Panel UI Improvements
**File:** `frontend/src/app/admin/page.tsx`

- Add prev/next pagination UI (current page, total count display)
- Render the missing `total_token_usage_today` stat card
- Fix tier type to `"free" | "paid"` union
- Remove unused imports
- Add link to `/changelog` (D3)

---

### B9. Auth Login Page Redesign
**File:** `frontend/src/app/auth/login/page.tsx`

- Centered card design matching landing page aesthetic
- Background grid matching landing page
- Add Google OAuth button (C2)
- Loading spinner while auth request is in flight

---

## Track C — New Features

### C1. Interview Search + Filter on Dashboard 🟡
**File:** `frontend/src/app/dashboard/page.tsx`

- Client-side search bar: filters by title in real-time
- Filter tabs: All | In Progress | Completed
- URL param persistence (`?status=completed&q=saas`)

---

### C2. Google OAuth Login 🟡
**File:** `frontend/src/app/auth/login/page.tsx`

- Add "Continue with Google" button
- `supabase.auth.signInWithOAuth({ provider: 'google', ... })`
- Document in README: enable Google OAuth in Supabase dashboard

---

### C3. Skip + Re-ask Buttons in Interview 🟡
**Files:** `frontend/src/app/interview/[id]/page.tsx`, `obx-backend/src/routes/interview.ts`

- Ghost buttons on each AssistantBubble: **Skip →** and **↺ Re-ask**
- Skip: sends `[SKIP]` token → backend system prompt moves to next topic
- Re-ask: sends `[REASK]` token → AI rephrases same question differently
- Update system prompt in `interview.ts` to handle both tokens

---

### C4. Interview Template Selection (2-Step Creation) 🟡
**File:** `frontend/src/app/interview/new/page.tsx`

- Step 1: Choose persona (existing 4 cards)
- Step 2: Choose template (SaaS / Consumer App / Marketplace / Internal Tool) or "Start Blank"
- Templates already exist in D1 (seed-templates.sql). `/templates` route already registered.
- Pass `template_id` to `POST /interview` if selected

---

### C5. Notion Export 🟡
**File:** `frontend/src/app/output/[id]/page.tsx`

- "Copy for Notion" button in output actions bar
- Client-side: clean markdown (strip unsupported syntax) → copy to clipboard
- Success toast confirmation

---

### C6. Delete Account + Export Data 🟡
**Files:** `frontend/src/app/settings/page.tsx`, `obx-backend/src/routes/user.ts`

**Delete Account:**
- "Danger Zone" card in settings with "Delete Account" button (red)
- Confirmation modal: user must type "DELETE"
- `DELETE /user` → cascade delete all data → Supabase admin delete
- Redirect to `/` with farewell toast

**Export Data:**
- "Export My Data" button
- `GET /user/export` → JSON with all interviews + messages + outputs + kanban items
- Download as `obx-studio-export.json`

---

### C7. Interview Duplicate Feature 🟡
**Files:** `frontend/src/app/dashboard/page.tsx`, `obx-backend/src/routes/interview.ts`

- "Duplicate" in interview card actions
- `POST /interview/:id/duplicate` → copy persona + messages, reset status, "Copy of " prefix title
- Redirect to new interview

---

### C8. Public Share Page 🟠
**Files:** `frontend/src/app/share/[id]/page.tsx`, `obx-backend/src/routes/output.ts`

**Backend:**
- `ALTER TABLE outputs ADD COLUMN shared INTEGER DEFAULT 0`
- `POST /output/:id/share` → sets `shared = 1`, returns shareable URL
- `GET /public/share/:outputId` → public route (no auth), returns output if shared

**Frontend:**
- "Share" button on output page → copies URL to clipboard
- Rewrite `share/[id]/page.tsx`: fetch from public endpoint, render markdown, show "Try it yourself" CTA

---

### C9. Voice Input → Cloudflare Workers AI Whisper 🟡
**Files:** `frontend/src/components/AudioRecorder.tsx`, `obx-backend/src/routes/voice.ts`

**Backend:**
- `POST /voice/transcribe` → accepts audio blob multipart → calls `@cf/openai/whisper` Workers AI model → returns `{ text: string }`

**Frontend:**
- AudioRecorder: MediaRecorder API → send blob → insert transcribed text into input
- Red pulsing dot while recording, loading spinner while transcribing

---

## Track D — Infrastructure & Quality

### D1. Canvas Persistence to D1 🟡
**Files:** `obx-backend/src/routes/interview.ts`, `frontend/src/hooks/useSupabaseCanvas.ts`

- Add `canvas_state TEXT` column to `interviews` table
- `PATCH /interview/:id/canvas` → saves `{ nodes, edges }` as JSON
- On interview load: parse `canvas_state` and initialize canvas
- Frontend: debounce (500ms) → auto-save on canvas changes
- Fix real-time broadcast bug first (A3)

---

### D2. Admin Email Alert on New Signup 🟡
**File:** `obx-backend/src/middleware/auth.ts`

- On first user upsert (new user), send admin alert email
- Use Cloudflare Email Workers binding or Resend free tier API
- Email: new user's email, timestamp, total user count
- Add `ADMIN_EMAIL` to `wrangler.jsonc` vars

---

### D3. Changelog / "What's New" 🟡
**New:** `frontend/src/app/changelog/page.tsx`

- Static `/changelog` page with version entries (TypeScript array, no CMS)
- Dashboard: small "What's New" card showing latest 2-3 entries
- Admin panel: link to changelog

---

### D4. Kanban Autofill Deduplication Fix 🟡
**File:** `obx-backend/src/routes/kanban.ts`

Autofill accumulates items if called multiple times.

**Fix:** Before inserting, delete all existing items:
```sql
DELETE FROM kanban_items WHERE interview_id = ? AND user_id = ?;
```

---

### D5. Auth Middleware Performance — Single Query 🟡
**File:** `obx-backend/src/middleware/auth.ts`

Currently 4 sequential DB queries per request.

**Fix:** Combine into a single `INSERT ... ON CONFLICT DO UPDATE ... RETURNING *` query that handles upsert, streak update, and daily reset atomically.

---

### D6. next/font Migration 🔵
**Files:** `frontend/src/app/globals.css`, `frontend/src/app/layout.tsx`

- Replace render-blocking `@import url(Google Fonts)` with `next/font/google` (`Inter`)
- Apply via `className={inter.variable}` on `<html>`

---

## File Change Summary

| File | Track | Type |
|------|-------|------|
| `obx-backend/schema.sql` | A1 | Fix |
| `obx-backend/alter-schema-3.sql` | A1 | **New** |
| `obx-backend/src/routes/interview.ts` | A2, C3, C7, D1 | Fix + Feature |
| `frontend/src/hooks/useSupabaseCanvas.ts` | A3, D1 | Fix |
| `frontend/src/components/ui/Toast.tsx` | A4 | **New** |
| `frontend/src/hooks/useToast.ts` | A4 | **New** |
| `frontend/src/app/layout.tsx` | A4, D6 | Fix |
| `frontend/src/app/kanban/[id]/page.tsx` | A5, A9, B6 | Fix + Redesign |
| `obx-backend/src/routes/kanban.ts` | A5, D4 | Fix |
| `frontend/src/app/auth/callback/page.tsx` | A6 | Fix |
| `frontend/src/components/providers/AuthProvider.tsx` | A7 | Fix |
| `frontend/src/lib/utils.ts` | A8 | Fix |
| `frontend/src/components/layout/MobileBlock.tsx` | A9 | Fix |
| `frontend/src/app/output/[id]/page.tsx` | A9, B5, C5, C8 | Fix + Feature |
| `frontend/src/components/layout/Navbar.tsx` | A10, A11 | Fix |
| `frontend/src/app/globals.css` | B1, D6 | Redesign |
| `frontend/src/app/page.tsx` | B2 | Redesign |
| `frontend/src/app/dashboard/page.tsx` | B3, C1, C7 | Redesign + Feature |
| `frontend/src/app/interview/[id]/page.tsx` | B4, C3 | Fix + Feature |
| `frontend/src/app/settings/page.tsx` | B7, C6 | Fix + Feature |
| `frontend/src/app/admin/page.tsx` | B8 | Fix + Feature |
| `frontend/src/app/auth/login/page.tsx` | B9, C2 | Redesign + Feature |
| `frontend/src/app/interview/new/page.tsx` | C4 | Feature |
| `frontend/src/app/share/[id]/page.tsx` | C8 | Feature |
| `frontend/src/components/AudioRecorder.tsx` | C9 | Feature |
| `obx-backend/src/routes/voice.ts` | C9 | Feature |
| `obx-backend/src/routes/user.ts` | C6 | Feature |
| `obx-backend/src/routes/output.ts` | C8 | Feature |
| `obx-backend/src/middleware/auth.ts` | A7, D2, D5 | Fix + Feature |
| `frontend/src/app/changelog/page.tsx` | D3 | **New** |

---

## Execution Order (Dependency-Aware)

```
PHASE 1 — Foundation (no deps, start immediately):
  A1 schema fix
  A4 toast system (Toast.tsx + useToast.ts)
  A9 mobile block cleanup
  A11 unused imports
  B1 global CSS + D6 next/font (do together)

PHASE 2 — After A4 (toast system ready):
  A5 kanban double-write fix
  A6 auth callback fix
  A7 auth provider dedup
  B7 settings redesign
  B8 admin redesign
  B9 login redesign + C2 Google OAuth

PHASE 3 — After B1 (design system ready):
  B2 landing page redesign
  B3 dashboard redesign + C1 search
  B4 interview page + C3 skip/reask
  B5 output page + C5 notion export
  B6 kanban redesign

PHASE 4 — After A3 (canvas broadcast fixed):
  D1 canvas persistence

PHASE 5 — New Features (independent):
  A2 rate limit enforcement
  C4 template selection
  C6 delete account + export data
  C7 duplicate interview
  C8 share page (backend + frontend)
  C9 voice → Workers AI Whisper
  D2 admin email alerts
  D3 changelog page
  D4 kanban autofill dedup
  D5 auth middleware optimization
```

---

## Key Decisions Summary

| Topic | Decision |
|-------|----------|
| Auth | Add Google OAuth (keep GitHub, skip email/password) |
| PDF Export | Deprioritized — fix .md export reliability only |
| Animations | Subtle fade-in-up + card hover effects throughout |
| Dashboard | Full redesign + recharts bar + donut charts |
| Canvas | Persist to D1 + fix real-time broadcast |
| Voice | Cloudflare Workers AI `@cf/openai/whisper` model |
| Share | Full implementation with public backend route |
| Templates | 2-step interview creation: persona → template |
| Interview Controls | Add Skip + Re-ask ghost buttons per AI question |
| Kanban | 5s undo-on-delete snackbar, fix double-write, fix autofill dedup |
| Settings | Add Delete Account + Export My Data |
| Admin | Pagination (prev/next), render missing stat card |
| Notifications | CF Email Workers admin alert on new user signup |
| Changelog | Static `/changelog` page + dashboard "What's New" card |
| Toast | Replace all `alert()` — Zustand toast stack |
| Design | Vercel/Linear — black/white, Inter font, fade-in-up animations |

