import type { Context } from "hono";
import type { Env } from "../types/env";
import { verifySupabaseJWT, extractBearerToken } from "../lib/jwt";
import type { DbUser } from "../types/db";

export type AuthContext = {
  userId: string;
  email: string;
  dbUser: DbUser;
};

/**
 * Middleware: verify JWT, load/upsert user in D1, attach to context.
 * ponytail: no separate session table — JWT is the session. Ceiling: can't
 * server-side revoke tokens before expiry; upgrade path is a token blocklist in KV.
 */
export async function requireAuth(
  c: Context<{ Bindings: Env }>,
  next: () => Promise<void>
) {
  const token = extractBearerToken(c.req.header("Authorization") ?? null);
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let payload;
  try {
    payload = await verifySupabaseJWT(token, c.env.SUPABASE_URL);
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }

  const today = new Date().toISOString().split("T")[0];

  // Upsert user — first visit creates the row
  await c.env.DB.prepare(
    `INSERT INTO users (id, email, tier, interviews_used_today, interviews_limit, last_reset_date, streak, total_interviews, total_questions_answered, is_admin, created_at, updated_at)
     VALUES (?, ?, 'free', 0, 3, ?, 0, 0, 0, 0, datetime('now'), datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       email = excluded.email,
       updated_at = datetime('now')`
  )
    .bind(payload.sub, payload.email, today)
    .run();

  // Reset daily counter if it's a new day
  await c.env.DB.prepare(
    `UPDATE users SET interviews_used_today = 0, last_reset_date = ?
     WHERE id = ? AND last_reset_date < ?`
  )
    .bind(today, payload.sub, today)
    .run();

  // Update streak
  await c.env.DB.prepare(
    `UPDATE users SET
       streak = CASE
         WHEN last_active_date = date('now', '-1 day') THEN streak + 1
         WHEN last_active_date = date('now') THEN streak
         ELSE 1
       END,
       last_active_date = date('now')
     WHERE id = ?`
  )
    .bind(payload.sub)
    .run();

  const dbUser = await c.env.DB.prepare(
    `SELECT * FROM users WHERE id = ?`
  )
    .bind(payload.sub)
    .first<DbUser>();

  if (!dbUser) {
    return c.json({ error: "User not found" }, 500);
  }

  c.set("userId" as never, payload.sub);
  c.set("email" as never, payload.email);
  c.set("dbUser" as never, dbUser);

  await next();
}

export async function requireAdmin(
  c: Context<{ Bindings: Env }>,
  next: () => Promise<void>
) {
  const dbUser = c.get("dbUser" as never) as DbUser;
  if (!dbUser?.is_admin) {
    return c.json({ error: "Forbidden" }, 403);
  }
  return next();
}
