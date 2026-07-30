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

/** POST /kanban/:interviewId/autofill — auto-fill kanban board using AI */
kanbanRoutes.post("/:interviewId/autofill", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const interviewId = c.req.param("interviewId");

  // 1. Get the latest output for this interview to base the tasks on
  const output = await c.env.DB.prepare(
    `SELECT content FROM outputs WHERE interview_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1`
  )
    .bind(interviewId, userId)
    .first<{ content: string }>();

  if (!output) {
    return c.json({ error: "No output document found to generate tasks from" }, 400);
  }

  // 2. Call AI to generate task list
  const { chatCompletion } = await import("../lib/openrouter");
  const { TASK_BREAKDOWN_PROMPT } = await import("../lib/prompts");
  
  let jsonString = "[]";
  try {
    jsonString = await chatCompletion(
      [
        { role: "system", content: "You are a helpful assistant that strictly outputs JSON." },
        { role: "user", content: `Here is the product spec:\n\n${output.content}\n\n${TASK_BREAKDOWN_PROMPT}` }
      ],
      c.env.OPENROUTER_API_KEY,
      2048
    );
  } catch (error: any) {
    return c.json({ error: "Failed to generate tasks via AI", details: error.message }, 500);
  }

  // 3. Parse JSON
  let tasks: any[] = [];
  try {
    const startIdx = jsonString.indexOf('[');
    const endIdx = jsonString.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1) {
      jsonString = jsonString.substring(startIdx, endIdx + 1);
    }
    tasks = JSON.parse(jsonString);
    if (!Array.isArray(tasks)) tasks = [];
  } catch (e) {
    return c.json({ error: "Failed to parse AI output", details: jsonString }, 500);
  }

  if (tasks.length === 0) {
    return c.json({ error: "AI returned no tasks" }, 400);
  }

  // 4. Insert tasks into the database
  const stmts = [];
  let position = 0;
  for (const task of tasks) {
    const id = nanoid();
    stmts.push(
      c.env.DB.prepare(
        `INSERT INTO kanban_items (id, interview_id, user_id, title, description, status, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(id, interviewId, userId, task.title || "Untitled", task.description || null, task.status || "todo", position++)
    );
  }
  
  if (stmts.length > 0) {
    await c.env.DB.batch(stmts);
  }

  return c.json({ ok: true, count: stmts.length });
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
