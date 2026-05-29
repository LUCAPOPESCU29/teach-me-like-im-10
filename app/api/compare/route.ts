import { groqChat } from "@/lib/anthropic";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { topicA, topicB } = await request.json();

    if (!topicA || !topicB) {
      return new Response("Missing topicA or topicB", { status: 400 });
    }

    const systemPrompt =
      "You are a teacher who explains things simply for a 10-year-old. Compare two topics in a fun, clear way.";

    const userPrompt = `Compare ${topicA} vs ${topicB}. Format your response as:

## What is it?
**${topicA}:** [explanation]
**${topicB}:** [explanation]

## How it works
**${topicA}:** [explanation]
**${topicB}:** [explanation]

## Used for
**${topicA}:** [uses]
**${topicB}:** [uses]

## Key difference
[The main difference in one simple sentence]

## Fun fact
[A surprising fact comparing these two]

## Verdict
[Which is "better" for what, or why both matter — keep it balanced and fun]`;

    const res = await groqChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
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
    console.error("Compare API error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
