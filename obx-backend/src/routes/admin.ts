import { Hono } from "hono";
import { requireAuth, requireAdmin } from "../middleware/auth";
import type { Env } from "../types/env";

export const adminRoutes = new Hono<{ Bindings: Env }>();

adminRoutes.use("*", requireAuth, requireAdmin);

/** GET /admin/stats — platform-wide stats */
adminRoutes.get("/stats", async (c) => {
  const [
    totalUsers,
    activeToday,
    activeWeek,
    interviewStats,
    tokenUsage,
    outputTypes,
    rateLimitHits,
  ] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) as count FROM users`).first<{ count: number }>(),
    c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM users WHERE last_active_date = date('now')`
    ).first<{ count: number }>(),
    c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM users WHERE last_active_date >= date('now', '-7 days')`
    ).first<{ count: number }>(),
    c.env.DB.prepare(
      `SELECT status, COUNT(*) as count FROM interviews GROUP BY status`
    ).all<{ status: string; count: number }>(),
    c.env.DB.prepare(
      `SELECT SUM(interviews_used_today) as used FROM users`
    ).first<{ used: number }>(),
    c.env.DB.prepare(
      `SELECT type, COUNT(*) as count FROM outputs GROUP BY type ORDER BY count DESC`
    ).all<{ type: string; count: number }>(),
    c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM users WHERE interviews_used_today >= interviews_limit`
    ).first<{ count: number }>(),
  ]);

  const statusMap = Object.fromEntries(
    interviewStats.results.map((r) => [r.status, r.count])
  );

  return c.json({
    total_users: totalUsers?.count ?? 0,
    active_today: activeToday?.count ?? 0,
    active_this_week: activeWeek?.count ?? 0,
    interviews_started: (statusMap["in_progress"] ?? 0) + (statusMap["completed"] ?? 0),
    interviews_completed: statusMap["completed"] ?? 0,
    total_token_usage_today: tokenUsage?.used ?? 0,
    output_types: outputTypes.results,
    rate_limit_hits: rateLimitHits?.count ?? 0,
  });
});

/** GET /admin/users — list all users (paginated) */
adminRoutes.get("/users", async (c) => {
  const page = Number(c.req.query("page") ?? 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  const users = await c.env.DB.prepare(
    `SELECT id, email, display_name, tier, interviews_used_today, interviews_limit,
     streak, total_interviews, is_admin, created_at, last_active_date
     FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all();

  return c.json(users.results);
});

/** PATCH /admin/users/:id — toggle admin, change tier */
adminRoutes.patch("/users/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    is_admin?: boolean;
    tier?: "free" | "paid";
    interviews_limit?: number;
  }>();

  await c.env.DB.prepare(
    `UPDATE users SET
       is_admin = COALESCE(?, is_admin),
       tier = COALESCE(?, tier),
       interviews_limit = COALESCE(?, interviews_limit),
       updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(
      body.is_admin != null ? (body.is_admin ? 1 : 0) : null,
      body.tier ?? null,
      body.interviews_limit ?? null,
      id
    )
    .run();

  return c.json({ ok: true });
});
