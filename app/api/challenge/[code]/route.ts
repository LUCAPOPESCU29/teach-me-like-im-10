import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createClient();

    const { data: challenge } = await supabase
      .from("friend_challenges")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (!challenge) {
      return Response.json({ error: "Challenge not found" }, { status: 404 });
    }

    const { data: participants } = await supabase
      .from("challenge_participants")
      .select("*")
      .eq("challenge_id", challenge.id)
      .order("score", { ascending: false, nullsFirst: false });

    const isExpired = new Date(challenge.expires_at) < new Date();
    const isFull = (participants?.length || 0) >= challenge.max_participants;

    return Response.json({
      challenge: {
        id: challenge.id,
        code: challenge.code,
        creatorName: challenge.creator_name,
        topic: challenge.topic_name,
        slug: challenge.topic_slug,
        questions: challenge.questions,
        lang: challenge.lang,
        maxParticipants: challenge.max_participants,
        createdAt: challenge.created_at,
        expiresAt: challenge.expires_at,
      },
      participants: (participants || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.participant_name,
        score: p.score,
        total: p.total,
        completedAt: p.completed_at,
        joinedAt: p.joined_at,
      })),
      isExpired,
      isFull,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
