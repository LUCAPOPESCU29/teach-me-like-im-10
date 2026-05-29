import { groqChat } from "@/lib/anthropic";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { topic, level } = await request.json();

    if (!topic || !level) {
      return new Response("Missing topic or level", { status: 400 });
    }

    const systemPrompt = `You are a teacher explaining topics to a 10-year-old. Your job is to generate an explanation of "${topic}" at difficulty level ${level}/5.

IMPORTANT: You must include exactly 2-3 subtle factual errors in the explanation. The errors should be plausible enough that a student might not notice them, but clearly wrong if you know the subject.

Write 6-10 sentences of explanation. Each sentence should be on its own line.

After the explanation, include a hidden comment that lists the errors in this exact format:
<!-- ERRORS: 1. [sentence that contains the error] :: [what the error is and what the correct fact should be] 2. [sentence that contains the error] :: [what the error is and what the correct fact should be] 3. [sentence that contains the error] :: [what the error is and what the correct fact should be] -->

Rules:
- The errors should be factual mistakes, not grammar or spelling errors
- Each error should be contained within a single sentence
- The error sentences in the ERRORS comment must exactly match the sentences in the explanation
- Do NOT use markdown formatting like bold, italic, headers, or bullet points — just plain sentences
- Each sentence on its own line
- Level 1 = very simple language, Level 5 = more advanced vocabulary`;

    const res = await groqChat(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Please explain "${topic}" at level ${level}. Remember to include exactly 2-3 subtle factual errors and the hidden ERRORS comment at the end.`,
        },
      ],
      { stream: true, max_tokens: 2048 }
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
    console.error("Wrong on Purpose API error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
