import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { chatCompletion } from "../lib/openrouter";
import { OUTPUT_PROMPTS, TASK_BREAKDOWN_PROMPT } from "../lib/prompts";
import type { Env } from "../types/env";
import type { DbUser, DbMessage } from "../types/db";
import { nanoid } from "../lib/nanoid";

export const outputRoutes = new Hono<{ Bindings: Env }>();

type OutputType = "prd" | "summary" | "roadmap" | "techstack" | "all";

/**
 * POST /output/:interviewId — generate the output doc for a completed interview.
 */
outputRoutes.post("/:interviewId", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const interviewId = c.req.param("interviewId");
  const { type } = await c.req.json<{ type: OutputType }>();

  if (!OUTPUT_PROMPTS[type]) {
    return c.json({ error: "Invalid output type" }, 400);
  }

  const interview = await c.env.DB.prepare(
    `SELECT * FROM interviews WHERE id = ? AND user_id = ?`
  )
    .bind(interviewId, userId)
    .first();

  if (!interview) return c.json({ error: "Not found" }, 404);
  if ((interview as any).status !== "completed") {
    return c.json({ error: "Interview not yet complete" }, 400);
  }

  // Check if output already exists for this type
  const existing = await c.env.DB.prepare(
    `SELECT id, content FROM outputs WHERE interview_id = ? AND type = ?`
  )
    .bind(interviewId, type)
    .first<{ id: string; content: string }>();

  if (existing) {
    return c.json({ id: existing.id, content: existing.content });
  }

  // Load full chat history (excluding system prompt — too long)
  const messages = await c.env.DB.prepare(
    `SELECT role, content FROM messages WHERE interview_id = ? AND role != 'system' ORDER BY created_at ASC`
  )
    .bind(interviewId)
    .all<Pick<DbMessage, "role" | "content">>();

  let content: string;
  try {
    const openRouterKey = c.req.header("X-OpenRouter-Key") ?? c.env.OPENROUTER_API_KEY;
    content = await chatCompletion(
      [
        ...messages.results as any,
        { role: "user", content: OUTPUT_PROMPTS[type] },
      ],
      openRouterKey,
      type === "all" ? 4096 : 2048
    );
  } catch (error: any) {
    return c.json({ error: "Failed to generate AI output", details: error.message }, 500);
  }

  const outputId = nanoid();
  await c.env.DB.prepare(
    `INSERT INTO outputs (id, interview_id, user_id, type, content, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`
  )
    .bind(outputId, interviewId, userId, type, content)
    .run();

  // Generate task breakdown and populate kanban automatically
  c.executionCtx.waitUntil(
    (async () => {
      // Only generate tasks if kanban is empty for this interview
      const existing = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM kanban_items WHERE interview_id = ?`
      )
        .bind(interviewId)
        .first<{ count: number }>();

      if ((existing?.count ?? 0) > 0) return;

      try {
        const openRouterKey = c.req.header("X-OpenRouter-Key") ?? c.env.OPENROUTER_API_KEY;
        const tasksRaw = await chatCompletion(
          [
            { role: "user", content: `Here is the app spec:\n\n${content}\n\n${TASK_BREAKDOWN_PROMPT}` },
          ],
          openRouterKey,
          1500
        );

        const tasks = JSON.parse(tasksRaw) as Array<{
          title: string;
          description: string;
          status: string;
        }>;

        const inserts = tasks.map((task, i) =>
          c.env.DB.prepare(
            `INSERT INTO kanban_items (id, interview_id, user_id, title, description, status, position, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'todo', ?, datetime('now'), datetime('now'))`
          ).bind(nanoid(), interviewId, userId, task.title, task.description ?? null, i)
        );

        await c.env.DB.batch(inserts);
      } catch (e) {
        console.error("Task breakdown failed:", e);
      }
    })()
  );

  return c.json({ id: outputId, content }, 201);
});

/**
 * GET /output/:interviewId — get all outputs for an interview.
 */
outputRoutes.get("/:interviewId", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const interviewId = c.req.param("interviewId");

  const results = await c.env.DB.prepare(
    `SELECT * FROM outputs WHERE interview_id = ? AND user_id = ? ORDER BY created_at ASC`
  )
    .bind(interviewId, userId)
    .all();

  return c.json(results.results);
});
