import { groqChat } from "@/lib/anthropic";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { topic, levels, lang } = await request.json();

    if (!topic || !levels || levels.length === 0) {
      return new Response("Missing topic or levels", { status: 400 });
    }

    const langName = lang && lang !== "en" ? (() => { const names: Record<string, string> = { ro: "Romanian", fr: "French", es: "Spanish", de: "German" }; return names[lang]; })() : null;

    const levelsContext = levels
      .map((l: { level: number; content: string }) => `Level ${l.level}: ${l.content}`)
      .join("\n\n");

    const res = await groqChat(
      [
        {
          role: "system",
          content: `You are a quiz generator. Based on the educational content provided about "${topic}", generate exactly 5 multiple-choice questions that test understanding across different depth levels.

RULES:
- Each question should have exactly 4 options (A, B, C, D)
- Only ONE option is correct
- Mix difficulty: 2 easy, 2 medium, 1 hard
- Questions should test genuine understanding, not just memorization
- Make wrong answers plausible but clearly wrong to someone who understood the material
- Keep questions concise and clear${langName ? `\n- IMPORTANT: Write ALL questions, options, and explanations in ${langName}.` : ""}

Return ONLY valid JSON in this exact format, nothing else:
{
  "questions": [
    {
      "question": "The question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why the correct answer is right.",
      "difficulty": "easy"
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Generate a quiz based on this content about "${topic}":\n\n${levelsContext}`,
        },
      ],
      { max_tokens: 1500 }
    );

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const quizData = jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: [] };

    return new Response(JSON.stringify(quizData), {
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
