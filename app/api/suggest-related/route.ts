import { groqChat } from "@/lib/anthropic";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: "Missing topic" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a knowledge graph assistant. Given a topic, suggest 3 related topics that would naturally follow for someone exploring that subject in a Wikipedia-style rabbit hole.

Return ONLY a JSON array with exactly 3 objects. Each object must have:
- "name": The topic name (title case, 2-5 words)
- "slug": A URL-friendly slug (lowercase, hyphens)
- "reason": One sentence explaining the connection to the original topic

Example response:
[{"name":"Quantum Entanglement","slug":"quantum-entanglement","reason":"A key phenomenon that demonstrates the non-local nature of quantum mechanics."},{"name":"Wave-Particle Duality","slug":"wave-particle-duality","reason":"The foundational concept showing how light and matter exhibit both wave and particle properties."},{"name":"Schrodinger Equation","slug":"schrodinger-equation","reason":"The mathematical framework that governs how quantum states evolve over time."}]

CRITICAL: Return ONLY the JSON array. No markdown, no code blocks, no explanation.`;

    const res = await groqChat(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Given the topic "${topic}", suggest 3 related topics that would naturally follow. Return JSON array of {name, slug, reason}.`,
        },
      ],
      { max_tokens: 512 }
    );

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the response
    // Try to extract JSON array from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse suggestions from AI response");
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (
      !Array.isArray(suggestions) ||
      suggestions.length === 0 ||
      !suggestions.every(
        (s: { name?: string; slug?: string; reason?: string }) =>
          s.name && s.slug && s.reason
      )
    ) {
      throw new Error("Invalid suggestion format");
    }

    return new Response(JSON.stringify({ suggestions: suggestions.slice(0, 3) }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Suggest-related API error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
