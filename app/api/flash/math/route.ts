import { NextRequest, NextResponse } from "next/server";
import { groqChat } from "@/lib/anthropic";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MATH_FLASH_PROMPT = `You are TM10 Math Flash — an elite math teacher and knowledge distiller. Your job is to take any math topic and create the perfect "under 10 minutes" learning experience that gives someone real, working understanding.

Return ONLY a valid JSON object with exactly these fields:

{
  "hook": "One mind-bending fact about this math topic that most people don't know. Counterintuitive, surprising, or awe-inspiring. Max 30 words. No formulas.",
  "concept": "Explain the core idea to a curious 10-year-old. Use a concrete real-world analogy. Zero jargon. 2-3 sentences. No formulas.",
  "steps": "How does it actually work? Break it into clear, numbered steps written as prose. Use simple notation like x^2 for squared, sqrt() for square root. 4-6 sentences.",
  "example": "A fully worked example with specific numbers. Show the work step by step in plain text. Use -> to show progression. Make it concrete and easy to follow. 5-8 steps.",
  "whyMatters": "Where does this appear in the real world? Give 2-3 specific, surprising applications. Be concrete. 2-3 sentences.",
  "practice": ["First practice problem — specific numbers, clear question. Medium difficulty.", "Second practice problem — slightly harder, tests understanding.", "Third practice problem — applies the concept in a new context."],
  "remember": "The single most important insight about this topic. One sentence that captures the essence. Make it memorable."
}

RULES:
- Be mathematically accurate above all
- Write like a brilliant tutor who makes math feel accessible and exciting
- Use plain text notation: x^2, sqrt(x), pi, theta, sum(), etc.
- The example must be fully worked out with actual numbers
- Practice problems must have definitive answers (calculable, not open-ended)
- No LaTeX, no markdown, no code fences in the output
- Return ONLY the JSON object`;

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }
    if (topic.trim().length > 200) {
      return NextResponse.json({ error: "Topic too long" }, { status: 400 });
    }

    const res = await groqChat(
      [
        { role: "system", content: MATH_FLASH_PROMPT },
        { role: "user", content: `Generate the Math Flash card for: "${topic.trim()}"` },
      ],
      { model: "llama-3.3-70b-versatile", max_tokens: 1400, stream: false }
    );

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(cleaned); }
    catch { return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 }); }

    const required = ["hook", "concept", "steps", "example", "whyMatters", "practice", "remember"];
    const missing = required.filter((k) => !parsed[k]);
    if (missing.length > 0) return NextResponse.json({ error: "Incomplete AI response" }, { status: 500 });

    if (!Array.isArray(parsed.practice)) {
      parsed.practice = [String(parsed.practice)];
    }

    return NextResponse.json({ sections: parsed, topic: topic.trim() });
  } catch (err) {
    console.error("math flash error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
