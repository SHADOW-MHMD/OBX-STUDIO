-- OBX-STUDIO Schema Migration 3
-- Adds missing columns that the app code references but schema.sql was missing.
-- Run: wrangler d1 execute obx-studio-db --file=alter-schema-3.sql

ALTER TABLE interviews ADD COLUMN IF NOT EXISTS persona TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS openrouter_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS openrouter_model TEXT DEFAULT 'nvidia/nemotron-ultra-253b-v1:free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_accent TEXT DEFAULT 'cyan';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS canvas_state TEXT;
ALTER TABLE outputs ADD COLUMN IF NOT EXISTS shared INTEGER DEFAULT 0;
