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
 * D5: Consolidated from 4 sequential queries to a single atomic upsert + one SELECT.
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
  } catch (error: any) {
    return c.json({ error: "Invalid token", details: error.message }, 401);
  }

  const today = new Date().toISOString().split("T")[0];

  // D5: Single atomic upsert — handles insert, daily reset, streak update in one go
  await c.env.DB.prepare(
    `INSERT INTO users (id, email, tier, interviews_used_today, interviews_limit, last_reset_date, streak, last_active_date, total_interviews, total_questions_answered, is_admin, created_at, updated_at)
     VALUES (?, ?, 'free', 0, 3, ?, 0, ?, 0, 0, 0, datetime('now'), datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       email = excluded.email,
       interviews_used_today = CASE WHEN last_reset_date < ? THEN 0 ELSE interviews_used_today END,
       last_reset_date = CASE WHEN last_reset_date < ? THEN ? ELSE last_reset_date END,
       streak = CASE
         WHEN last_active_date = date('now', '-1 day') THEN streak + 1
         WHEN last_active_date = date('now') THEN streak
         ELSE 1
       END,
       last_active_date = date('now'),
       updated_at = datetime('now')`
  )
    .bind(payload.sub, payload.email, today, today, today, today, today)
    .run();

  const dbUser = await c.env.DB.prepare(
    `SELECT * FROM users WHERE id = ?`
  )
    .bind(payload.sub)
    .first<DbUser>();

  if (!dbUser) {
    return c.json({ error: "User not found" }, 500);
  }

  // D2: Send admin email alert on first user creation
  if (dbUser.created_at === dbUser.updated_at) {
    c.executionCtx?.waitUntil?.(
      sendNewUserAlert(c.env, payload.email, payload.sub).catch(() => {})
    );
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

/**
 * D2: Send admin email alert when a new user signs up.
 * Uses Resend API if RESEND_API_KEY is set.
 */
async function sendNewUserAlert(env: Env, userEmail: string, userId: string): Promise<void> {
  const adminEmail = (env as any).ADMIN_EMAIL;
  const resendKey = (env as any).RESEND_API_KEY;
  if (!adminEmail || !resendKey) return;

  const countRow = await (env as any).DB?.prepare("SELECT COUNT(*) as total FROM users").first<{ total: number }>();
  const totalUsers = countRow?.total ?? "?";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "OBX-STUDIO <noreply@obx-studio.dev>",
      to: adminEmail,
      subject: `🎉 New user signed up: ${userEmail}`,
      html: `
        <p><strong>New user joined OBX-STUDIO!</strong></p>
        <p>Email: ${userEmail}</p>
        <p>User ID: ${userId}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>Total users now: ${totalUsers}</p>
      `,
    }),
  });
}
