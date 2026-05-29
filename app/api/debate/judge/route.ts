import { groqChat } from "@/lib/anthropic";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { topic, side1, side2, arguments: debateArgs } = await request.json();

    if (!topic || !side1 || !side2 || !debateArgs || !Array.isArray(debateArgs)) {
      return new Response(
        JSON.stringify({ error: "Missing topic, sides, or arguments" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const formattedArgs = debateArgs
      .map(
        (a: { side: string; text: string }, i: number) =>
          `Round ${Math.floor(i / 2) + 1} - ${a.side === "user" ? "Student" : "AI"} (${
            a.side === "user" ? side1.toUpperCase() : side2.toUpperCase()
          }): "${a.text}"`
      )
      .join("\n\n");

    const systemPrompt = `You are a fair and encouraging debate judge in a learning app for kids and teens. You need to judge a debate between a student and an AI opponent.

Topic: "${topic}"
Student argued: ${side1.toUpperCase()}
AI argued: ${side2.toUpperCase()}

Here are all the arguments from the debate:

${formattedArgs}

Judge the debate fairly. Give scores out of 10 for each side. Be encouraging to the student - highlight what they did well even if the AI argued better. Remember this is a learning experience.

You MUST respond with ONLY valid JSON in this exact format, no other text:
{
  "winner": "user" or "ai",
  "userScore": <number 1-10>,
  "aiScore": <number 1-10>,
  "feedback": "<2-3 sentences of encouraging feedback. Mention what the student did well, what could improve, and what they learned from this debate.>"
}`;

    const res = await groqChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Judge this debate and respond with JSON only." },
      ],
      { max_tokens: 512 }
    );

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "{}";

    let judgment;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      judgment = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      judgment = {
        winner: "user",
        userScore: 7,
        aiScore: 7,
        feedback: "Great debate! Both sides made strong arguments. Keep practicing your debating skills!",
      };
    }

    const result = {
      winner: judgment.winner === "ai" ? "ai" : "user",
      userScore: Math.min(10, Math.max(1, judgment.userScore ?? 7)),
      aiScore: Math.min(10, Math.max(1, judgment.aiScore ?? 7)),
      feedback:
        judgment.feedback ||
        "Great debate! Both sides made compelling arguments. Keep practicing!",
    };

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Debate Judge API error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
