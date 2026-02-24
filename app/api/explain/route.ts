import { groqChat } from "@/lib/anthropic";
import { buildExplainPrompt } from "@/lib/prompts";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { topic, level, previousLevels } = await request.json();

    if (!topic || !level) {
      return new Response("Missing topic or level", { status: 400 });
    }

    const systemPrompt = buildExplainPrompt(topic, level, previousLevels || []);

    const res = await groqChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please explain "${topic}" at level ${level}.` },
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
    console.error("Explain API error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
