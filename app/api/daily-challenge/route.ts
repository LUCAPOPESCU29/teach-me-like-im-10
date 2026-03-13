import { groqChat } from "@/lib/anthropic";
import { getDailyTopic } from "@/lib/daily-topics";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { topic, slug, date } = getDailyTopic();
    const supabase = await createClient();

    // Check if today's challenge already exists
    const { data: existing } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("date", date)
      .single();

    if (existing) {
      // Check if current user already completed it
      const { data: { user } } = await supabase.auth.getUser();
      let completed = false;
      let userScore = 0;
      if (user) {
        const { data: completion } = await supabase
          .from("daily_challenge_completions")
          .select("score")
          .eq("user_id", user.id)
          .eq("challenge_date", date)
          .single();
        if (completion) {
          completed = true;
          userScore = completion.score;
        }
      }

      return Response.json({
        date: existing.date,
        topic: existing.topic_name,
        slug: existing.topic_slug,
        levelContent: existing.level_content,
        questions: existing.questions,
        completed,
        userScore,
      });
    }

    // Generate Level 1 content
    const contentRes = await groqChat(
      [
        {
          role: "system",
          content: `You are an extraordinary teacher who can explain anything at exactly the right level of depth. Generate a Level 1 "The Basics" explanation for the topic: "${topic}".

Explain like I'm a curious 10-year-old. Use everyday analogies, no jargon. Make it fun and relatable. Use vivid comparisons to things kids know (games, food, sports, school). Keep it to 3-4 short paragraphs.

Use Markdown formatting: bold key terms. Write in an engaging, human voice. Do not include the level label/header.`,
        },
        { role: "user", content: `Explain "${topic}" at a beginner level.` },
      ],
      { max_tokens: 1024 }
    );

    const contentData = await contentRes.json();
    const levelContent = contentData.choices?.[0]?.message?.content || "";

    // Generate 5 quiz questions
    const quizRes = await groqChat(
      [
        {
          role: "system",
          content: `You are a quiz generator. Based on the educational content provided about "${topic}", generate exactly 5 multiple-choice questions.

RULES:
- Each question should have exactly 4 options
- Only ONE option is correct
- Mix difficulty: 2 easy, 2 medium, 1 hard
- Questions should test genuine understanding
- Make wrong answers plausible but clearly wrong to someone who understood
- Keep questions concise and clear

Return ONLY valid JSON in this exact format:
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
          content: `Generate a quiz based on this content about "${topic}":\n\n${levelContent}`,
        },
      ],
      { max_tokens: 1500 }
    );

    const quizData = await quizRes.json();
    const quizText = quizData.choices?.[0]?.message?.content || "{}";
    const jsonMatch = quizText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: [] };
    const questions = parsed.questions || [];

    // Cache in database (ON CONFLICT to handle race conditions)
    await supabase.from("daily_challenges").upsert(
      {
        date,
        topic_name: topic,
        topic_slug: slug,
        level_content: levelContent,
        questions,
      },
      { onConflict: "date" }
    );

    return Response.json({
      date,
      topic,
      slug,
      levelContent,
      questions,
      completed: false,
      userScore: 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
