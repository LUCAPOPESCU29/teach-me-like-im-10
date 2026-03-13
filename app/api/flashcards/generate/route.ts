import { NextResponse } from "next/server";
import { groqChat } from "@/lib/anthropic";
import { buildFlashcardPrompt } from "@/lib/prompts";

export async function POST(request: Request) {
  try {
    const { topic, levels, lang } = await request.json();

    if (!topic || !levels || levels.length === 0) {
      return NextResponse.json(
        { error: "Topic and levels are required" },
        { status: 400 }
      );
    }

    const prompt = buildFlashcardPrompt(topic, levels, lang);

    const res = await groqChat(
      [{ role: "user", content: prompt }],
      { max_tokens: 2048 }
    );

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse flashcards" },
        { status: 500 }
      );
    }

    const flashcards = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ flashcards });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Flashcard generation failed" },
      { status: 500 }
    );
  }
}
