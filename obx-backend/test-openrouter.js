import dotenv from "dotenv";
dotenv.config({ path: ".dev.vars" });

const apiKey = process.env.OPENROUTER_API_KEY;
const FREE_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

async function run() {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://obx-studio.pages.dev",
      "X-Title": "OBX-STUDIO",
    },
    body: JSON.stringify({
      model: FREE_MODEL,
      messages: [{ role: "user", content: "hello" }],
      stream: false,
      max_tokens: 6000,
    }),
  });
  
  if (!res.ok) {
    console.error("Error:", res.status, await res.text());
  } else {
    console.log("Success");
  }
}
run();
