# OBX-STUDIO

> AI-powered idea interview tool for indie devs. Turn your half-baked idea into a full spec.

**Stack:** Next.js + Tailwind + shadcn/ui · Hono.js · Cloudflare Workers + D1 · Supabase Auth · OpenRouter

---

## Project Structure

```
new-great-project/
├── frontend/          ← Next.js app (Cloudflare Pages)
└── obx-backend/       ← Hono.js Worker (Cloudflare Workers + D1)
```

---

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Enable GitHub + Google OAuth in **Authentication → Providers**
3. Copy your **Project URL** and **anon key** from **Settings → API**

### 2. Cloudflare D1

```bash
cd obx-backend

# Create the D1 database
npx wrangler d1 create obx-studio-db

# Copy the database_id into wrangler.jsonc
# Then apply the schema:
npx wrangler d1 execute obx-studio-db --file=schema.sql
```

### 3. OpenRouter API Key

1. Get a free key at [openrouter.ai](https://openrouter.ai)
2. Set it as a Worker secret:

```bash
cd obx-backend
npx wrangler secret put OPENROUTER_API_KEY
```

Also set your Supabase URL as a var in `wrangler.jsonc`:
```json
"vars": { "SUPABASE_URL": "https://YOUR_PROJECT.supabase.co" }
```

### 4. Frontend env

```bash
cd frontend
cp .env.example .env.local
# Fill in your Supabase URL + anon key
```

---

## Development

```bash
# Terminal 1 — backend
cd obx-backend && npm run dev
# Runs on http://localhost:8787

# Terminal 2 — frontend
cd frontend && npm run dev
# Runs on http://localhost:3000
```

---

## Deployment

### Backend (Cloudflare Workers)

```bash
cd obx-backend
npx wrangler deploy
```

### Frontend (Cloudflare Pages)

Connect your GitHub repo to Cloudflare Pages:
- Build command: `npm run build`
- Build output: `.next`
- Root directory: `frontend`
- Add env vars in Pages dashboard

---

## Making yourself admin

After signing up, run this in Wrangler:

```bash
cd obx-backend
npx wrangler d1 execute obx-studio-db \
  --command="UPDATE users SET is_admin = 1 WHERE email = 'your@email.com'"
```

---

## License

MIT — open source, self-hostable. See `.env.example` to run your own instance.
