import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { streamChatCompletion } from "../lib/openrouter";
import { INTERVIEW_SYSTEM_PROMPT } from "../lib/prompts";
import type { Env } from "../types/env";
import type { DbUser, DbMessage } from "../types/db";
import { nanoid } from "../lib/nanoid";

export const interviewRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /interview — create a new interview session.
 * Checks daily limit before creating.
 */
interviewRoutes.post("/", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const dbUser = c.get("dbUser" as never) as DbUser;

  if (dbUser.interviews_used_today >= dbUser.interviews_limit) {
    return c.json(
      {
        error: "Daily limit reached",
        used: dbUser.interviews_used_today,
        limit: dbUser.interviews_limit,
      },
      429
    );
  }

  const id = nanoid();
  await c.env.DB.prepare(
    `INSERT INTO interviews (id, user_id, status, created_at, updated_at)
     VALUES (?, ?, 'in_progress', datetime('now'), datetime('now'))`
  )
    .bind(id, userId)
    .run();

  // Increment daily usage
  await c.env.DB.prepare(
    `UPDATE users SET interviews_used_today = interviews_used_today + 1,
     total_interviews = total_interviews + 1 WHERE id = ?`
  )
    .bind(userId)
    .run();

  // Save system message
  await c.env.DB.prepare(
    `INSERT INTO messages (id, interview_id, role, content, created_at)
     VALUES (?, ?, 'system', ?, datetime('now'))`
  )
    .bind(nanoid(), id, INTERVIEW_SYSTEM_PROMPT)
    .run();

  return c.json({ id }, 201);
});

/**
 * GET /interview — list all interviews for the current user.
 */
interviewRoutes.get("/", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;

  const result = await c.env.DB.prepare(
    `SELECT i.*, o.type as output_type, o.id as output_id
     FROM interviews i
     LEFT JOIN outputs o ON o.interview_id = i.id
     WHERE i.user_id = ?
     ORDER BY i.updated_at DESC`
  )
    .bind(userId)
    .all();

  return c.json(result.results);
});

/**
 * GET /interview/:id — get a single interview with all messages.
 */
interviewRoutes.get("/:id", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const id = c.req.param("id");

  const interview = await c.env.DB.prepare(
    `SELECT * FROM interviews WHERE id = ? AND user_id = ?`
  )
    .bind(id, userId)
    .first();

  if (!interview) return c.json({ error: "Not found" }, 404);

  const messages = await c.env.DB.prepare(
    `SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at ASC`
  )
    .bind(id)
    .all();

  return c.json({ interview, messages: messages.results });
});

/**
 * POST /interview/:id/message — send a user message, get AI question back (streamed).
 */
interviewRoutes.post("/:id/message", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const dbUser = c.get("dbUser" as never) as DbUser;
  const id = c.req.param("id");

  const interview = await c.env.DB.prepare(
    `SELECT * FROM interviews WHERE id = ? AND user_id = ?`
  )
    .bind(id, userId)
    .first();

  if (!interview) return c.json({ error: "Not found" }, 404);
  if ((interview as any).status === "completed") {
    return c.json({ error: "Interview already completed" }, 400);
  }

  const { content } = await c.req.json<{ content: string }>();
  if (!content?.trim()) return c.json({ error: "Empty message" }, 400);

  // Save user message
  await c.env.DB.prepare(
    `INSERT INTO messages (id, interview_id, role, content, created_at)
     VALUES (?, ?, 'user', ?, datetime('now'))`
  )
    .bind(nanoid(), id, content)
    .run();

  // Update question count
  await c.env.DB.prepare(
    `UPDATE users SET total_questions_answered = total_questions_answered + 1 WHERE id = ?`
  )
    .bind(userId)
    .run();

  // Load full message history for this interview
  const allMessages = await c.env.DB.prepare(
    `SELECT role, content FROM messages WHERE interview_id = ? ORDER BY created_at ASC`
  )
    .bind(id)
    .all<Pick<DbMessage, "role" | "content">>();

  // Stream AI response
  const stream = await streamChatCompletion(
    allMessages.results as any,
    c.env.OPENROUTER_API_KEY
  );

  // Tee the stream: one copy goes to client, one we accumulate to save to DB
  const [clientStream, saveStream] = stream.tee();

  // Save accumulated response to DB in background
  c.executionCtx.waitUntil(
    (async () => {
      const reader = saveStream.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let interviewDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        // Parse SSE lines to extract content
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.choices?.[0]?.delta?.content ?? "";
              fullContent += delta;
            } catch {}
          }
        }
      }

      // Save assistant message
      await c.env.DB.prepare(
        `INSERT INTO messages (id, interview_id, role, content, created_at)
         VALUES (?, ?, 'assistant', ?, datetime('now'))`
      )
        .bind(nanoid(), id, fullContent)
        .run();

      // Check if AI signalled completion
      try {
        const parsed = JSON.parse(fullContent);
        if (parsed.done === true) {
          interviewDone = true;
          await c.env.DB.prepare(
            `UPDATE interviews SET status = 'completed', title = ?, updated_at = datetime('now') WHERE id = ?`
          )
            .bind(parsed.summary?.slice(0, 100) ?? "Untitled idea", id)
            .run();
        }
      } catch {}

      await c.env.DB.prepare(
        `UPDATE interviews SET updated_at = datetime('now') WHERE id = ?`
      )
        .bind(id)
        .run();
    })()
  );

  return new Response(clientStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

/**
 * DELETE /interview/:id — delete interview and all its data.
 */
interviewRoutes.delete("/:id", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const id = c.req.param("id");

  const interview = await c.env.DB.prepare(
    `SELECT id FROM interviews WHERE id = ? AND user_id = ?`
  )
    .bind(id, userId)
    .first();

  if (!interview) return c.json({ error: "Not found" }, 404);

  await c.env.DB.batch([
    c.env.DB.prepare(`DELETE FROM messages WHERE interview_id = ?`).bind(id),
    c.env.DB.prepare(`DELETE FROM outputs WHERE interview_id = ?`).bind(id),
    c.env.DB.prepare(`DELETE FROM kanban_items WHERE interview_id = ?`).bind(id),
    c.env.DB.prepare(`DELETE FROM interviews WHERE id = ?`).bind(id),
  ]);

  return c.json({ ok: true });
});
