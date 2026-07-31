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

/** GET /user/settings — get user settings (masking the key) */
userRoutes.get("/settings", requireAuth, async (c) => {
  const dbUser = c.get("dbUser" as never) as DbUser & { openrouter_key?: string, openrouter_model?: string };
  return c.json({
    has_key: !!dbUser.openrouter_key,
    openrouter_model: dbUser.openrouter_model || "nvidia/nemotron-3-ultra-550b-a55b:free",
  });
});

/** PATCH /user/settings — update user settings */
userRoutes.patch("/settings", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const { openrouter_key, openrouter_model } = await c.req.json<{
    openrouter_key?: string;
    openrouter_model?: string;
  }>();

  const updates: string[] = [];
  const params: any[] = [];

  if (openrouter_key !== undefined) {
    if (openrouter_key.trim() === "") {
      updates.push("openrouter_key = NULL");
    } else {
      const { encryptKey } = await import("../lib/crypto");
      const encrypted = await encryptKey(openrouter_key.trim(), c.env.ENCRYPTION_KEY);
      updates.push("openrouter_key = ?");
      params.push(encrypted);
    }
  }

  if (openrouter_model !== undefined) {
    if (openrouter_model.trim() === "") {
      updates.push("openrouter_model = NULL");
    } else {
      updates.push("openrouter_model = ?");
      params.push(openrouter_model.trim());
    }
  }

  if (updates.length > 0) {
    await c.env.DB.prepare(
      `UPDATE users SET ${updates.join(", ")}, updated_at = datetime('now') WHERE id = ?`
    )
      .bind(...params, userId)
      .run();
  }

  return c.json({ ok: true });
});
