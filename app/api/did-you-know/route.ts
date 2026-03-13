import { groqChat } from "@/lib/anthropic";
import { buildDidYouKnowPrompt } from "@/lib/prompts";

export const maxDuration = 15;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { topics } = await request.json();

    const prompt = buildDidYouKnowPrompt(topics);

    const res = await groqChat(
      [{ role: "user", content: prompt }],
      { max_tokens: 150 }
    );

    const data = await res.json();
    const fact = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ fact }), {
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
