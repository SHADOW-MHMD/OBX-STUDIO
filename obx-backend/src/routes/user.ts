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
  const { openrouter_key, openrouter_model, theme_accent } = await c.req.json<{
    openrouter_key?: string;
    openrouter_model?: string;
    theme_accent?: string;
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

  if (theme_accent !== undefined) {
    updates.push("theme_accent = ?");
    params.push(theme_accent.trim());
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

/** DELETE /user — cascade-delete all user data then remove the auth account */
userRoutes.delete("/", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;

  // Cascade delete in dependency order
  const interviewRows = await c.env.DB.prepare(
    `SELECT id FROM interviews WHERE user_id = ?`
  )
    .bind(userId)
    .all<{ id: string }>();

  const interviewIds = interviewRows.results.map((r) => r.id);

  if (interviewIds.length > 0) {
    // Delete messages and outputs tied to each interview via batch
    const deleteMessages = interviewIds.map((iid) =>
      c.env.DB.prepare(`DELETE FROM messages WHERE interview_id = ?`).bind(iid)
    );
    const deleteOutputs = interviewIds.map((iid) =>
      c.env.DB.prepare(`DELETE FROM outputs WHERE interview_id = ?`).bind(iid)
    );
    const deleteKanban = interviewIds.map((iid) =>
      c.env.DB.prepare(`DELETE FROM kanban_items WHERE interview_id = ?`).bind(iid)
    );
    await c.env.DB.batch([...deleteMessages, ...deleteOutputs, ...deleteKanban]);
  }

  // Delete interviews row
  await c.env.DB.prepare(`DELETE FROM interviews WHERE user_id = ?`).bind(userId).run();
  // Delete user row
  await c.env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(userId).run();

  // Attempt Supabase admin delete (best-effort)
  if (c.env.SUPABASE_SERVICE_ROLE_KEY && c.env.SUPABASE_URL) {
    try {
      await fetch(`${c.env.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      });
    } catch (e) {
      console.error("Supabase admin delete failed (non-fatal):", e);
    }
  }

  return c.json({ ok: true });
});

/** GET /user/export — download all user data as a JSON file */
userRoutes.get("/export", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const dbUser = c.get("dbUser" as never) as DbUser;

  const interviewRows = await c.env.DB.prepare(
    `SELECT * FROM interviews WHERE user_id = ? ORDER BY created_at ASC`
  )
    .bind(userId)
    .all<Record<string, unknown>>();

  const interviews = await Promise.all(
    interviewRows.results.map(async (interview) => {
      const iid = interview.id as string;

      const [messages, outputs, kanbanItems] = await Promise.all([
        c.env.DB.prepare(
          `SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at ASC`
        )
          .bind(iid)
          .all<Record<string, unknown>>(),
        c.env.DB.prepare(
          `SELECT * FROM outputs WHERE interview_id = ? ORDER BY created_at ASC`
        )
          .bind(iid)
          .all<Record<string, unknown>>(),
        c.env.DB.prepare(
          `SELECT * FROM kanban_items WHERE interview_id = ? ORDER BY position ASC`
        )
          .bind(iid)
          .all<Record<string, unknown>>(),
      ]);

      return {
        ...interview,
        messages: messages.results,
        outputs: outputs.results,
        kanban_items: kanbanItems.results,
      };
    })
  );

  const payload = {
    user: dbUser,
    interviews,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="obx-studio-export.json"`,
    },
  });
});
