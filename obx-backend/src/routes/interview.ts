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
 * Checks daily limit before creating.
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

  // A2: Enforce daily interview limit
  if (dbUser.interviews_used_today >= dbUser.interviews_limit) {
    return c.json({ error: "Daily limit reached", code: "RATE_LIMITED" }, 429);
  }

  const { personaId, template_id } = await c.req.json<{ personaId: string; template_id?: string }>()
    .catch(() => ({ personaId: "pm", template_id: undefined }));

  const id = nanoid();
  await c.env.DB.prepare(
    `INSERT INTO interviews (id, user_id, persona, template_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'in_progress', datetime('now'), datetime('now'))`
  )
    .bind(id, userId, personaId, template_id ?? null)
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
 * Supports [SKIP] and [REASK] tokens for C3.
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

  // C3: Handle [SKIP] and [REASK] special tokens
  let systemPromptOverride = getInterviewSystemPrompt(personaId, isHeavyTurn);
  if (content.includes("[SKIP]")) {
    systemPromptOverride += "\n\nIMPORTANT: The user wants to skip this question. Acknowledge briefly and move to the next topic immediately.";
  }
  if (content.includes("[REASK]")) {
    systemPromptOverride += "\n\nIMPORTANT: The user wants the question rephrased. Ask the same question using completely different wording and a fresh angle.";
  }

  const systemMessageIndex = allMessages.results.findIndex(m => m.role === "system");
  if (systemMessageIndex !== -1) {
    allMessages.results[systemMessageIndex].content = systemPromptOverride;
  }

  // Inject the canvasState into the very last user message in memory (so the AI can read it)
  if (canvasState && allMessages.results.length > 0) {
    const lastMsg = allMessages.results[allMessages.results.length - 1];
    if (lastMsg.role === 'user') {
      const rawEdges = canvasState.edges ?? canvasState.links ?? [];
      const strippedCanvas = {
        nodes: canvasState.nodes?.map((n: any) => ({
          id: n.id,
          name: n.name || n.label || n.data?.label || n.id,
          category: n.category ?? n.type ?? 'default',
        })),
        edges: rawEdges.map((e: any) => ({
          source: typeof e.source === 'string' ? e.source : e.source?.id,
          target: typeof e.target === 'string' ? e.target : e.target?.id,
          label: e.label,
        })),
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
 * PATCH /interview/:id/canvas — D1: Save canvas state.
 */
interviewRoutes.patch("/:id/canvas", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const id = c.req.param("id");

  const interview = await c.env.DB.prepare(
    `SELECT id FROM interviews WHERE id = ? AND user_id = ?`
  )
    .bind(id, userId)
    .first();

  if (!interview) return c.json({ error: "Not found" }, 404);

  const body = await c.req.json<{ nodes: any[]; edges?: any[]; links?: any[] }>();
  const edges = body.edges ?? body.links ?? [];

  await c.env.DB.prepare(
    `UPDATE interviews SET canvas_state = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(JSON.stringify({ nodes: body.nodes, edges }), id)
    .run();

  return c.json({ ok: true });
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

/**
 * POST /interview/:id/duplicate — C7: Duplicate an interview.
 */
interviewRoutes.post("/:id/duplicate", requireAuth, async (c) => {
  const userId = c.get("userId" as never) as string;
  const dbUser = c.get("dbUser" as never) as DbUser;
  const sourceId = c.req.param("id");

  // Check daily limit
  if (dbUser.interviews_used_today >= dbUser.interviews_limit) {
    return c.json({ error: "Daily limit reached", code: "RATE_LIMITED" }, 429);
  }

  const interview = await c.env.DB.prepare(
    `SELECT * FROM interviews WHERE id = ? AND user_id = ?`
  )
    .bind(sourceId, userId)
    .first();

  if (!interview) return c.json({ error: "Not found" }, 404);

  const messages = await c.env.DB.prepare(
    `SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at ASC`
  )
    .bind(sourceId)
    .all<DbMessage>();

  const newId = nanoid();
  const sourceTitle = (interview as any).title ?? "Untitled idea";
  const newTitle = `Copy of ${sourceTitle}`.slice(0, 100);

  await c.env.DB.prepare(
    `INSERT INTO interviews (id, user_id, persona, title, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'in_progress', datetime('now'), datetime('now'))`
  )
    .bind(newId, userId, (interview as any).persona ?? "pm", newTitle)
    .run();

  // Copy messages
  const stmts = messages.results.map((msg) =>
    c.env.DB.prepare(
      `INSERT INTO messages (id, interview_id, role, content, created_at) VALUES (?, ?, ?, ?, datetime('now'))`
    ).bind(nanoid(), newId, msg.role, msg.content)
  );

  if (stmts.length > 0) {
    await c.env.DB.batch(stmts);
  }

  // Increment usage
  await c.env.DB.prepare(
    `UPDATE users SET interviews_used_today = interviews_used_today + 1,
     total_interviews = total_interviews + 1 WHERE id = ?`
  )
    .bind(userId)
    .run();

  return c.json({ id: newId }, 201);
});
