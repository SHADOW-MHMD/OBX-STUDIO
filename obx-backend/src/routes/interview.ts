import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { streamChatCompletion } from "../lib/openrouter";
import { getInterviewSystemPrompt } from "../lib/prompts";
import type { Env } from "../types/env";
import type { DbUser, DbMessage, DbTemplate } from "../types/db";
import { nanoid } from "../lib/nanoid";

export const interviewRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /interview — create a new interview session.
 * Checks daily limit before creating. Requires template_id.
 */
interviewRoutes.post("/", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const dbUser = c.get("dbUser" as never) as DbUser & { openrouter_key?: string };

  if (!dbUser.openrouter_key) {
    return c.json(
      { error: "No OpenRouter API key found. Please set it in Settings." },
      403
    );
  }

  const { personaId } = await c.req.json<{ personaId: string }>().catch(() => ({ personaId: "pm" }));

  const id = nanoid();
  await c.env.DB.prepare(
    `INSERT INTO interviews (id, user_id, persona, status, created_at, updated_at)
     VALUES (?, ?, ?, 'in_progress', datetime('now'), datetime('now'))`
  )
    .bind(id, userId, personaId)
    .run();

  // Increment daily usage
  await c.env.DB.prepare(
    `UPDATE users SET interviews_used_today = interviews_used_today + 1,
     total_interviews = total_interviews + 1 WHERE id = ?`
  )
    .bind(userId)
    .run();

  // Save system message using dynamic prompt generator
  const systemPrompt = getInterviewSystemPrompt(personaId, false);

  await c.env.DB.prepare(
    `INSERT INTO messages (id, interview_id, role, content, created_at)
     VALUES (?, ?, 'system', ?, datetime('now'))`
  )
    .bind(nanoid(), id, systemPrompt)
    .run();

  return c.json({ id }, 201);
});

/**
 * GET /interview — list all interviews for the current user.
 */
interviewRoutes.get("/", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;

  const result = await c.env.DB.prepare(
    `SELECT *
     FROM interviews
     WHERE user_id = ?
     ORDER BY updated_at DESC`
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

  const { content, canvasState } = await c.req.json<{ content: string, canvasState?: any }>();
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
    `SELECT id, role, content FROM messages WHERE interview_id = ? ORDER BY created_at ASC`
  )
    .bind(id)
    .all<{ id: string, role: string, content: string }>();

  const totalUserMessages = allMessages.results.filter(m => m.role === "user").length;
  const isHeavyTurn = totalUserMessages > 0 && totalUserMessages % 2 === 0;

  // Retrieve persona to update system prompt dynamically for this turn
  const personaId = (interview as any).persona || "pm";
  
  const systemMessageIndex = allMessages.results.findIndex(m => m.role === "system");
  if (systemMessageIndex !== -1) {
    allMessages.results[systemMessageIndex].content = getInterviewSystemPrompt(personaId, isHeavyTurn);
  }

  // Inject the canvasState into the very last user message in memory (so the AI can read it)
  if (canvasState && allMessages.results.length > 0) {
    const lastMsg = allMessages.results[allMessages.results.length - 1];
    if (lastMsg.role === 'user') {
      const strippedCanvas = {
        nodes: canvasState.nodes?.map((n: any) => ({ id: n.id, type: n.type, data: n.data })),
        edges: canvasState.edges?.map((e: any) => ({ source: e.source, target: e.target }))
      };
      lastMsg.content = `${lastMsg.content}\n\n[Current Neural Canvas State:\n${JSON.stringify(strippedCanvas)}]`;
    }
  }

  // Stream AI response
  let stream: ReadableStream;
  try {
    const dbUserRow = await c.env.DB.prepare(
      `SELECT openrouter_key, openrouter_model FROM users WHERE id = ?`
    ).bind((interview as any).user_id).first<{ openrouter_key?: string, openrouter_model?: string }>();

    if (!dbUserRow?.openrouter_key) {
      return c.json({ error: "API key not configured" }, 403);
    }

    const { decryptKey } = await import("../lib/crypto");
    const openRouterKey = await decryptKey(dbUserRow.openrouter_key, c.env.ENCRYPTION_KEY);
    const openRouterModel = dbUserRow.openrouter_model || undefined;

    stream = await streamChatCompletion(
      allMessages.results as any,
      openRouterKey,
      openRouterModel
    );
  } catch (error: any) {
    return c.json({ error: "Failed to communicate with AI", details: error.message }, 500);
  }

  // Tee the stream: one copy goes to client, one we accumulate to save to DB
  const [clientStream, saveStream] = stream.tee();

  // Save accumulated response to DB in background
  c.executionCtx.waitUntil(
    (async () => {
      const reader = saveStream.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let interviewDone = false;
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          
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
 * PATCH /interview/:id — update interview metadata (e.g. title).
 */
interviewRoutes.patch("/:id", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const id = c.req.param("id");

  const interview = await c.env.DB.prepare(
    `SELECT id FROM interviews WHERE id = ? AND user_id = ?`
  )
    .bind(id, userId)
    .first();

  if (!interview) return c.json({ error: "Not found" }, 404);

  const { title } = await c.req.json<{ title?: string }>();
  if (title === undefined || !title.trim()) {
    return c.json({ error: "Invalid title" }, 400);
  }

  await c.env.DB.prepare(
    `UPDATE interviews SET title = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(title.trim(), id)
    .run();

  return c.json({ ok: true, title: title.trim() });
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
