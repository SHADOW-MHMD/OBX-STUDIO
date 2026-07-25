import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import type { Env } from "../types/env";
import type { DbUser } from "../types/db";

export const userRoutes = new Hono<{ Bindings: Env }>();

/** GET /user/stats — user's own dashboard stats */
userRoutes.get("/stats", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const dbUser = c.get("dbUser" as never) as DbUser;

  const statusCounts = await c.env.DB.prepare(
    `SELECT status, COUNT(*) as count FROM interviews WHERE user_id = ? GROUP BY status`
  )
    .bind(userId)
    .all<{ status: string; count: number }>();

  const statusMap = Object.fromEntries(
    statusCounts.results.map((r) => [r.status, r.count])
  );

  return c.json({
    total_interviews: dbUser.total_interviews,
    interviews_used_today: dbUser.interviews_used_today,
    interviews_limit: dbUser.interviews_limit,
    streak: dbUser.streak,
    total_questions_answered: dbUser.total_questions_answered,
    in_progress: statusMap["in_progress"] ?? 0,
    completed: statusMap["completed"] ?? 0,
  });
});
