export interface Env {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
  SUPABASE_JWT_SECRET: string;
  SUPABASE_URL: string;
  ADMIN_USER_IDS: string; // comma-separated list of admin supabase user IDs
  ENCRYPTION_KEY: string;
}
