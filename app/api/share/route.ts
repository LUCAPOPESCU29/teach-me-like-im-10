import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function generateShareCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const {
      topicSlug,
      topicName,
      lang,
      levels,
      sharerName,
      sharerUserId,
      message,
    } = await request.json();

    if (!topicSlug || !topicName || !levels || levels.length === 0) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const completedLevels = levels.filter(
      (l: { complete: boolean }) => l.complete
    );
    if (completedLevels.length === 0) {
      return Response.json(
        { error: "Must complete at least one level" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Generate unique code (retry on collision)
    let code = generateShareCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from("shared_topics")
        .select("id")
        .eq("share_code", code)
        .single();
      if (!existing) break;
      code = generateShareCode();
      attempts++;
    }

    const maxLevel = Math.max(
      ...completedLevels.map((l: { level: number }) => l.level),
      0
    );

    const { error: insertError } = await supabase
      .from("shared_topics")
      .insert({
        share_code: code,
        sharer_user_id: sharerUserId || null,
        sharer_name: sharerName || "A friend",
        topic_slug: topicSlug,
        topic_name: topicName,
        lang: lang || "en",
        levels: completedLevels,
        max_level: maxLevel,
        personal_message: message?.trim() || null,
      });

    if (insertError) throw insertError;

    return Response.json({ code });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
