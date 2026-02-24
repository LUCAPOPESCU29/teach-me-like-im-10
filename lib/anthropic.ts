// Groq API helper using native fetch (more reliable in serverless environments)
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export function getGroqApiKey(): string {
  return process.env.GROQ_API_KEY || "";
}

export async function groqChat(
  messages: { role: string; content: string }[],
  options: { model?: string; max_tokens?: number; stream?: boolean } = {}
) {
  const apiKey = getGroqApiKey();
  if (!apiKey || apiKey === "placeholder") {
    throw new Error("GROQ_API_KEY not configured");
  }

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model || "llama-3.3-70b-versatile",
      max_tokens: options.max_tokens || 2048,
      stream: options.stream || false,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    throw new Error(`Groq API error (${res.status}): ${errText}`);
  }

  return res;
}
