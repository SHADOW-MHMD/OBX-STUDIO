-- OBX-STUDIO D1 Schema
-- Run: wrangler d1 execute obx-studio-db --file=schema.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Supabase user UUID
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free',
  interviews_used_today INTEGER NOT NULL DEFAULT 0,
  interviews_limit INTEGER NOT NULL DEFAULT 3,
  last_reset_date TEXT NOT NULL DEFAULT (date('now')),
  streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,
  total_interviews INTEGER NOT NULL DEFAULT 0,
  total_questions_answered INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0, -- SQLite boolean
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' | 'completed'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'system' | 'assistant' | 'user'
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_interview_id ON messages(interview_id);

CREATE TABLE IF NOT EXISTS outputs (
  id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'prd' | 'summary' | 'roadmap' | 'techstack' | 'all'
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_outputs_interview_id ON outputs(interview_id);
CREATE INDEX IF NOT EXISTS idx_outputs_user_id ON outputs(user_id);

CREATE TABLE IF NOT EXISTS kanban_items (
  id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo', -- 'todo' | 'in_progress' | 'done'
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kanban_interview_id ON kanban_items(interview_id);
CREATE INDEX IF NOT EXISTS idx_kanban_user_id ON kanban_items(user_id);
