import { groqChat } from "@/lib/anthropic";
import { buildTreePrompt } from "@/lib/prompts";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { topics, mode } = await request.json();

    if (!topics || !Array.isArray(topics) || topics.length < 2) {
      return new Response(JSON.stringify({ error: "Need at least 2 topics" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Cap at 30 most recent
    const capped = topics.slice(0, 30);

    const res = await groqChat(
      [{ role: "user", content: buildTreePrompt(capped, mode || "general") }],
      { max_tokens: 2048 }
    );

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!parsed.categories || !parsed.nodes || !parsed.edges) {
      return new Response(JSON.stringify({ error: "Invalid graph structure" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Tree API error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
