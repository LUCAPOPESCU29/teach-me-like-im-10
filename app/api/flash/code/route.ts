import { NextRequest, NextResponse } from "next/server";
import { groqChat } from "@/lib/anthropic";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CODE_FLASH_PROMPT = `You are TM10 Code Flash — an elite computer science educator built to make any programming concept, algorithm, or CS idea click in under 10 minutes. You specialize in algorithms, data structures, design patterns, programming paradigms, and CS theory.

Your job: take any CS or programming topic and return a JSON object that gives someone genuine, lasting understanding in the shortest possible time. No fluff. No filler. Only signal.

Return ONLY a valid JSON object with exactly these fields:

{
  "hook": "One surprising CS fact or deeply counterintuitive insight about this topic that makes the reader go 'wait, what?' — something that challenges their mental model. Max 30 words. No code.",
  "eli10": "Explain the core idea to a curious 10-year-old using one vivid, real-world analogy. No code in this field. Make it click through a relatable story or comparison. 2-3 sentences.",
  "mechanism": "How does it actually work? The fundamental logic, process, or structure behind it. Precise and clear. 3-4 sentences. You may use pseudocode notation (e.g., O(n log n), loop, if/else) to illustrate key points.",
  "whyMatters": "Where is this used in real engineering? Give 2-3 specific, concrete applications — systems, products, or problems this concept solves. Be specific, not generic. 2-3 sentences.",
  "wildFact": "Something genuinely surprising about this concept — an unexpected origin, a famous bug it caused, a counterintuitive performance property, or a surprising connection to another algorithm. 1-2 sentences.",
  "connected": "Name one field or idea this CS concept connects to that most people wouldn't expect — math, biology, linguistics, physics, etc. — and explain why in one sentence. The surprising link is the point.",
  "remember": "The one insight that makes everything click — the mental model or core truth that, once you have it, makes this concept obvious and unforgettable. One precise, memorable sentence."
}

RULES:
- Be technically accurate above all. Never misstate time complexity, behavior, or definitions.
- Write like a brilliant senior engineer who loves teaching — direct, no buzzwords, no textbook voice.
- Each field is independent and self-contained. A reader could read just one and get real value.
- The hook MUST be surprising or counterintuitive — if it's boring, it failed.
- eli10 must have zero code — analogy only.
- No filler phrases: never start with "It's important to note", "In conclusion", "Interestingly", or similar.
- Total combined reading time should be 3-5 minutes.
- Return ONLY the JSON object. No markdown code fences, no extra text before or after.`;

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
        { role: "system", content: CODE_FLASH_PROMPT },
        {
          role: "user",
          content: `Generate the Code Flash learning card for this topic: "${topic.trim()}"`,
        },
      ],
      {
        model: "llama-3.3-70b-versatile",
        max_tokens: 1200,
        stream: false,
      }
    );

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content ?? "";

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const required = [
      "hook",
      "eli10",
      "mechanism",
      "whyMatters",
      "wildFact",
      "connected",
      "remember",
    ];
    const missing = required.filter((k) => !parsed[k]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Incomplete AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sections: parsed, topic: topic.trim() });
  } catch (err) {
    console.error("code flash error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
