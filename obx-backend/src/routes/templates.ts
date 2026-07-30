import { Hono } from "hono";
import type { Env } from "../types/env";
import { requireAuth } from "../middleware/auth";
import type { DbTemplate } from "../types/db";

const router = new Hono<{ Bindings: Env; Variables: { user_id: string } }>();

router.use("*", requireAuth);

router.get("/", async (c) => {
  const userId = c.get("user_id");
  const db = c.env.DB;

  const result = await db
    .prepare("SELECT * FROM templates WHERE owner_id IS NULL OR owner_id = ? ORDER BY is_fork ASC, created_at DESC")
    .bind(userId)
    .all<DbTemplate>();

  if (!result.success) {
    return c.json({ error: "Database error" }, 500);
  }

  // Parse checklists_json for frontend convenience
  const templates = result.results.map((t) => ({
    ...t,
    checklists: JSON.parse(t.checklists_json),
  }));

  return c.json(templates);
});

export { router as templateRoutes };
