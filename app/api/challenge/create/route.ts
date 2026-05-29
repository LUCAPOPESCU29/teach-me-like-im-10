import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const { topic, slug, questions, lang, creatorName, creatorScore, creatorTotal } = await request.json();

    if (!topic || typeof topic !== "string" || topic.length > 200) {
      return Response.json({ error: "Missing or invalid topic" }, { status: 400 });
    }

    // Validate questions array structure
    if (!Array.isArray(questions) || questions.length === 0 || questions.length > 20) {
      return Response.json({ error: "Questions must be an array of 1–20 items" }, { status: 400 });
    }
    for (const q of questions) {
      if (
        typeof q.question !== "string" ||
        !Array.isArray(q.options) ||
        q.options.length < 2 ||
        q.options.length > 6 ||
        typeof q.answer !== "number" ||
        q.answer < 0 ||
        q.answer >= q.options.length
      ) {
        return Response.json({ error: "Invalid question format" }, { status: 400 });
      }
    }

    if (typeof creatorScore === "number" && (creatorScore < 0 || creatorScore > questions.length)) {
      return Response.json({ error: "Invalid creator score" }, { status: 400 });
    }

    const supabase = await createClient();

    // Generate unique code (retry on collision)
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from("friend_challenges")
        .select("id")
        .eq("code", code)
        .single();
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    // Create challenge
    const { data: challenge, error: insertError } = await supabase
      .from("friend_challenges")
      .insert({
        code,
        creator_name: creatorName || "Anonymous",
        topic_name: topic,
        topic_slug: slug || topic.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        questions,
        lang: lang || "en",
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    // Add creator as first participant with their score
    await supabase.from("challenge_participants").insert({
      challenge_id: challenge.id,
      participant_name: creatorName || "Anonymous",
      score: creatorScore ?? null,
      total: creatorTotal || 5,
      completed_at: creatorScore != null ? new Date().toISOString() : null,
    });

    return Response.json({ code, challengeId: challenge.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
