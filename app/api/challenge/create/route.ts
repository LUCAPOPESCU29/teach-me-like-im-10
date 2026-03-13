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

    if (!topic || !questions || questions.length === 0) {
      return Response.json({ error: "Missing topic or questions" }, { status: 400 });
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
