import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { participantName } = await request.json();

    if (!participantName?.trim()) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch challenge
    const { data: challenge } = await supabase
      .from("friend_challenges")
      .select("id, max_participants, expires_at, questions")
      .eq("code", code.toUpperCase())
      .single();

    if (!challenge) {
      return Response.json({ error: "Challenge not found" }, { status: 404 });
    }

    if (new Date(challenge.expires_at) < new Date()) {
      return Response.json({ error: "Challenge has expired" }, { status: 410 });
    }

    // Check participant count
    const { count } = await supabase
      .from("challenge_participants")
      .select("id", { count: "exact", head: true })
      .eq("challenge_id", challenge.id);

    if ((count || 0) >= challenge.max_participants) {
      return Response.json({ error: "Challenge is full" }, { status: 409 });
    }

    // Check if name already taken in this challenge
    const { data: existingByName } = await supabase
      .from("challenge_participants")
      .select("id, score, completed_at")
      .eq("challenge_id", challenge.id)
      .eq("participant_name", participantName.trim())
      .single();

    if (existingByName) {
      // Already joined — return their status
      return Response.json({
        success: true,
        alreadyJoined: true,
        participantId: existingByName.id,
        completed: existingByName.completed_at != null,
        questions: challenge.questions,
      });
    }

    // Join
    const { data: participant, error: joinError } = await supabase
      .from("challenge_participants")
      .insert({
        challenge_id: challenge.id,
        participant_name: participantName.trim(),
      })
      .select("id")
      .single();

    if (joinError) throw joinError;

    return Response.json({
      success: true,
      alreadyJoined: false,
      participantId: participant.id,
      completed: false,
      questions: challenge.questions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
