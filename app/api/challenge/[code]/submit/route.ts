import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { participantId, score, total } = await request.json();

    if (!participantId) {
      return Response.json({ error: "Missing participantId" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify challenge exists
    const { data: challenge } = await supabase
      .from("friend_challenges")
      .select("id")
      .eq("code", code.toUpperCase())
      .single();

    if (!challenge) {
      return Response.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Update participant score
    const { error: updateError } = await supabase
      .from("challenge_participants")
      .update({
        score,
        total: total || 5,
        completed_at: new Date().toISOString(),
      })
      .eq("id", participantId)
      .eq("challenge_id", challenge.id);

    if (updateError) throw updateError;

    // Fetch updated participants for podium
    const { data: participants } = await supabase
      .from("challenge_participants")
      .select("*")
      .eq("challenge_id", challenge.id)
      .order("score", { ascending: false, nullsFirst: false });

    return Response.json({
      success: true,
      participants: (participants || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.participant_name,
        score: p.score,
        total: p.total,
        completedAt: p.completed_at,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
