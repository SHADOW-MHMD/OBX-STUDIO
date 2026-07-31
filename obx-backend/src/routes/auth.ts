import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import type { Env } from "../types/env";
import type { DbUser } from "../types/db";

export const authRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /auth/me — returns current user's profile + usage stats.
 * Called by frontend on every page load to sync state.
 */
authRoutes.get("/me", requireAuth, async (c) => {
  const dbUser = c.get("dbUser" as never) as DbUser;
  return c.json({
    id: dbUser.id,
    email: dbUser.email,
    display_name: dbUser.display_name,
    avatar_url: dbUser.avatar_url,
    tier: dbUser.tier,
    interviews_used_today: dbUser.interviews_used_today,
    interviews_limit: dbUser.interviews_limit,
    streak: dbUser.streak,
    total_interviews: dbUser.total_interviews,
    total_questions_answered: dbUser.total_questions_answered,
    is_admin: dbUser.is_admin,
    has_key: !!(dbUser as any).openrouter_key,
    openrouter_model: (dbUser as any).openrouter_model || "nvidia/nemotron-3-ultra-550b-a55b:free",
  }, 200, {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  });
});

/**
 * PATCH /auth/profile — update display name or avatar.
 */
authRoutes.patch("/profile", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const body = await c.req.json<{ display_name?: string; avatar_url?: string }>();

  await c.env.DB.prepare(
    `UPDATE users SET display_name = COALESCE(?, display_name),
     avatar_url = COALESCE(?, avatar_url), updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(body.display_name ?? null, body.avatar_url ?? null, userId)
    .run();

  return c.json({ ok: true });
});
