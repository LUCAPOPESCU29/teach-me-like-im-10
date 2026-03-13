import { groqChat } from "@/lib/anthropic";
import { buildEvaluatePrompt } from "@/lib/prompts";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { topic, explanation, levels, lang } = await request.json();

    if (!topic || !explanation || !levels) {
      return new Response("Missing required fields", { status: 400 });
    }

    const prompt = buildEvaluatePrompt(topic, explanation, levels, lang);

    const res = await groqChat(
      [{ role: "user", content: prompt }],
      { max_tokens: 800 }
    );

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 0, feedback: "Could not evaluate." };

    return new Response(JSON.stringify(evaluation), {
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
