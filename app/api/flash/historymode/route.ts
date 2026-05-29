import { NextRequest, NextResponse } from "next/server";
import { groqChat } from "@/lib/anthropic";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const HISTORY_FLASH_PROMPT = `You are TM10 History Flash — an elite historian and storyteller built to make any historical event, figure, era, or movement come alive in under 10 minutes. You specialize in world history, ancient civilizations, modern history, historical figures, and social/political movements.

Your job: take any history topic and return a JSON object that gives someone genuine, lasting understanding in the shortest possible time. No fluff. No filler. Only signal.

Return ONLY a valid JSON object with exactly these fields:

{
  "hook": "One surprising historical fact that most people don't know about this topic — something that challenges the conventional story, reveals a hidden irony, or reframes the entire event. Max 30 words.",
  "eli10": "The core story or event explained simply, as you'd tell it to a curious 10-year-old. A clear, human narrative — who, what, and why in plain language. 2-3 sentences.",
  "mechanism": "The underlying forces, causes, and conditions that made this happen. What social, economic, political, or cultural pressures were at work? Why was this moment inevitable or surprising? 3-4 sentences.",
  "whyMatters": "Why does this historical event or figure still shape today's world? Name concrete, specific ways it influences modern politics, culture, technology, or society. Be specific — not 'it was important', but how exactly. 2-3 sentences.",
  "wildFact": "The most surprising, little-known aspect of this topic — a personal detail about a historical figure, a bizarre coincidence, an ironic outcome, or something that completely flips the popular understanding. 1-2 sentences.",
  "connected": "An unexpected connection between this historical topic and something modern, from a different culture, or from an entirely different field — and explain why that connection is significant in one sentence.",
  "remember": "The one sentence that captures why this moment in history matters — the essential truth about its meaning, legacy, or lesson that should outlast every other detail. Make it memorable and precise."
}

RULES:
- Be historically accurate above all. Never invent events, misattribute quotes, or distort timelines.
- Write like a brilliant historian friend — vivid, direct, storytelling voice, not a textbook.
- Each field is independent and self-contained. A reader could read just one and get real value.
- The hook MUST reveal something most people genuinely don't know — if it's a cliche, it failed.
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
        { role: "system", content: HISTORY_FLASH_PROMPT },
        {
          role: "user",
          content: `Generate the History Flash learning card for this topic: "${topic.trim()}"`,
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
    console.error("history flash error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
