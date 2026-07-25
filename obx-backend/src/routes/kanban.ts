import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import type { Env } from "../types/env";
import type { DbUser } from "../types/db";
import { nanoid } from "../lib/nanoid";

export const kanbanRoutes = new Hono<{ Bindings: Env }>();

/** GET /kanban/:interviewId — get all kanban items for an interview */
kanbanRoutes.get("/:interviewId", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const interviewId = c.req.param("interviewId");

  const items = await c.env.DB.prepare(
    `SELECT * FROM kanban_items WHERE interview_id = ? AND user_id = ?
     ORDER BY position ASC`
  )
    .bind(interviewId, userId)
    .all();

  return c.json(items.results);
});

/** PATCH /kanban/:id — update status or position of a kanban item */
kanbanRoutes.patch("/:id", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const id = c.req.param("id");
  const body = await c.req.json<{
    status?: "todo" | "in_progress" | "done";
    position?: number;
    title?: string;
    description?: string;
  }>();

  const item = await c.env.DB.prepare(
    `SELECT id FROM kanban_items WHERE id = ? AND user_id = ?`
  )
    .bind(id, userId)
    .first();

  if (!item) return c.json({ error: "Not found" }, 404);

  await c.env.DB.prepare(
    `UPDATE kanban_items SET
       status = COALESCE(?, status),
       position = COALESCE(?, position),
       title = COALESCE(?, title),
       description = COALESCE(?, description),
       updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`
  )
    .bind(
      body.status ?? null,
      body.position ?? null,
      body.title ?? null,
      body.description ?? null,
      id,
      userId
    )
    .run();

  return c.json({ ok: true });
});

/** POST /kanban/:interviewId/item — add a custom kanban item */
kanbanRoutes.post("/:interviewId/item", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const interviewId = c.req.param("interviewId");
  const { title, description } = await c.req.json<{
    title: string;
    description?: string;
  }>();

  if (!title?.trim()) return c.json({ error: "Title required" }, 400);

  // Get current max position
  const max = await c.env.DB.prepare(
    `SELECT MAX(position) as maxPos FROM kanban_items WHERE interview_id = ? AND user_id = ?`
  )
    .bind(interviewId, userId)
    .first<{ maxPos: number | null }>();

  const id = nanoid();
  await c.env.DB.prepare(
    `INSERT INTO kanban_items (id, interview_id, user_id, title, description, status, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'todo', ?, datetime('now'), datetime('now'))`
  )
    .bind(id, interviewId, userId, title, description ?? null, (max?.maxPos ?? -1) + 1)
    .run();

  return c.json({ id }, 201);
});

/** DELETE /kanban/:id — delete a kanban item */
kanbanRoutes.delete("/:id", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const id = c.req.param("id");

  await c.env.DB.prepare(
    `DELETE FROM kanban_items WHERE id = ? AND user_id = ?`
  )
    .bind(id, userId)
    .run();

  return c.json({ ok: true });
});
