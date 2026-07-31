import { Hono } from "hono";
import type { Env } from "../types/env";

export const voiceRoutes = new Hono<{ Bindings: Env }>();

voiceRoutes.post("/transcribe", async (c) => {
  const body = await c.req.parseBody();
  const file = body["audio"];

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No audio file provided" }, 400);
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await c.env.AI.run("@cf/openai/whisper", {
      audio: [...new Uint8Array(arrayBuffer)],
    });

    return c.json({ text: result.text });
  } catch (error) {
    console.error("Transcription error:", error);
    return c.json({ error: "Transcription failed" }, 500);
  }
});
