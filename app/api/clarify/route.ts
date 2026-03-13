import { groqChat } from "@/lib/anthropic";
import { buildClarifyPrompt } from "@/lib/prompts";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { paragraph, topic, level, lang } = await request.json();

    if (!paragraph || !topic) {
      return new Response("Missing paragraph or topic", { status: 400 });
    }

    const prompt = buildClarifyPrompt(paragraph, topic, level || 1, lang);

    const res = await groqChat(
      [{ role: "user", content: prompt }],
      { max_tokens: 300 }
    );

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ clarification: text.trim() }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
