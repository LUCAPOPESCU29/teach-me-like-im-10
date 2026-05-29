import { NextRequest, NextResponse } from "next/server";
import { groqChat } from "@/lib/anthropic";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const FLASH_PROMPT = `You are TM10 Flash — an elite knowledge distiller built to create the perfect "under 10 minutes" learning experience for any topic.

Your job: take any topic and return a JSON object that gives someone genuine, lasting understanding in the shortest possible time. No fluff. No filler. Only signal.

Return ONLY a valid JSON object with exactly these fields:

{
  "hook": "One electrifying sentence that makes the reader go 'wait, what?' — a counterintuitive fact, a massive scale comparison, or a surprising consequence. Must reframe how they see the topic. Max 30 words.",
  "eli10": "Explain the core idea to a curious 10-year-old using one vivid, concrete analogy. Make it click instantly. 2-3 sentences max.",
  "mechanism": "How does it actually work? The fundamental mechanism, process, or logic behind it. Precise and clear. 3-4 sentences. You may use simple technical terms if you define them briefly.",
  "whyMatters": "Why should anyone care? Real-world impact, applications, or consequences that affect people's lives. 2-3 sentences. Be specific — not generic.",
  "wildFact": "One genuinely surprising, counterintuitive, or mind-expanding fact that most people don't know. Something that makes you want to tell someone else immediately. 1-2 sentences.",
  "connected": "Name one field or idea this topic connects to that most people wouldn't expect — and explain why in one sentence. The surprising link is the point.",
  "remember": "The single most important sentence about this topic. If they forget everything else, this is what should stick. Make it memorable and precise."
}

RULES:
- Be accurate above all. Never invent facts.
- Write like a brilliant friend who happens to be an expert — direct, warm, no textbook voice.
- Each field is independent and self-contained. A reader could read just one and get real value.
- The hook MUST be surprising or counterintuitive — if it's boring, it failed.
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
        { role: "system", content: FLASH_PROMPT },
        {
          role: "user",
          content: `Generate the Flash learning card for this topic: "${topic.trim()}"`,
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

    // Strip markdown code fences if the model wrapped it
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const required = ["hook", "eli10", "mechanism", "whyMatters", "wildFact", "connected", "remember"];
    const missing = required.filter((k) => !parsed[k]);
    if (missing.length > 0) {
      return NextResponse.json({ error: "Incomplete AI response" }, { status: 500 });
    }

    return NextResponse.json({ sections: parsed, topic: topic.trim() });
  } catch (err) {
    console.error("flash error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
