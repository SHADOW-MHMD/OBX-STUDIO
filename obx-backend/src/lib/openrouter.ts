const API_BASE = "https://openrouter.ai/api/v1";
// ponytail: using openrouter free tier for nemotron
const MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

export interface ChatMessage {
  role: "system" | "assistant" | "user";
  content: string;
}

/**
 * Stream a chat completion from OpenRouter.
 * Returns a ReadableStream of SSE data.
 */
export async function streamChatCompletion(
  messages: ChatMessage[],
  apiKey: string,
  model = MODEL,
  maxTokens = 900
): Promise<ReadableStream> {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "text/event-stream"
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok || !res.body) {
    const errorText = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${errorText}`);
  }

  return res.body;
}

/**
 * Non-streaming completion — used for final output document generation.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  apiKey: string,
  maxTokens = 4096,
  model = MODEL
): Promise<string> {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json<{
    choices: Array<{ message: { content: string } }>;
  }>();
  return data.choices[0]?.message?.content ?? "";
}
