import { groqChat } from "@/lib/anthropic";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { topic, side, userArgument, round } = await request.json();

    if (!topic || !side || !userArgument || !round) {
      return new Response(
        JSON.stringify({ error: "Missing topic, side, userArgument, or round" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const aiSide = side === "for" ? "against" : "for";
    const aiSideLabel = aiSide === "for" ? "FOR" : "AGAINST";
    const userSideLabel = side === "for" ? "FOR" : "AGAINST";

    const isLastRound = round >= 3;

    const systemPrompt = `You are a fun, smart debate opponent in a learning app for kids and teens. You argue ${aiSideLabel} the topic: "${topic}".

Your opponent (a student) is arguing ${userSideLabel}. Keep your arguments simple, clear, and easy for a 10-year-old to understand. Use examples, analogies, and everyday comparisons. Be persuasive but friendly - never mean or condescending.

This is round ${round} of 3. ${
      round === 1
        ? "Start with your strongest, simplest argument."
        : round === 2
          ? "Build on what was said before. Introduce a new angle or counter their point directly."
          : "This is the final round. Make your closing argument strong and memorable."
    }

Keep your response to 2-3 short paragraphs. Do NOT use markdown formatting. Write in plain conversational text.${
      isLastRound
        ? "\n\nAfter your argument, add a blank line then write 'JUDGE_VERDICT:' followed by a brief, encouraging judgment of the whole debate. Be fair and kind - mention what the student did well even if the AI argued better."
        : ""
    }`;

    const res = await groqChat(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Round ${round}: The student argues ${userSideLabel}: "${userArgument}"\n\nWrite your ${aiSideLabel} counter-argument.`,
        },
      ],
      { stream: true, max_tokens: 1024 }
    );

    if (!res.body) {
      throw new Error("No response body from Groq");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const text = parsed.choices?.[0]?.delta?.content;
                if (text) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                  );
                }
              } catch {
                // Skip unparseable chunks
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Debate API error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
