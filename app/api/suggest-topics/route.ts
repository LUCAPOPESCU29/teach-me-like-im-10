import { groqChat } from "@/lib/anthropic";
import { buildSuggestPrompt } from "@/lib/prompts";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { topic, lang } = await request.json();

    if (!topic) {
      return new Response("Missing topic", { status: 400 });
    }

    const res = await groqChat(
      [{ role: "user", content: buildSuggestPrompt(topic, lang) }],
      { max_tokens: 256 }
    );

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "[]";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(JSON.stringify({ suggestions }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Suggest API error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
