const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
// ponytail: hardcoded free model — upgrade path is to expose model picker in admin panel
const FREE_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

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
  apiKey: string
): Promise<ReadableStream> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://obx-studio.pages.dev",
      "X-Title": "OBX-STUDIO",
    },
    body: JSON.stringify({
      model: FREE_MODEL,
      messages,
      stream: true,
      max_tokens: 1024,
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
  maxTokens = 4096
): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://obx-studio.pages.dev",
      "X-Title": "OBX-STUDIO",
    },
    body: JSON.stringify({
      model: FREE_MODEL,
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
