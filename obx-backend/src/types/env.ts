export interface Env {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
  SUPABASE_JWT_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY?: string; // optional — used for server-side admin ops
  ADMIN_USER_IDS: string; // comma-separated list of admin supabase user IDs
  ENCRYPTION_KEY: string;
  AI: any;
}
