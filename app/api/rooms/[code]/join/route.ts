import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const displayName = profile?.display_name || "Learner";

    // Fetch room
    const { data: room } = await supabase
      .from("study_rooms")
      .select("id, max_participants, expires_at, status")
      .eq("code", code.toUpperCase())
      .single();

    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    if (new Date(room.expires_at) < new Date()) {
      return Response.json({ error: "Room has expired" }, { status: 410 });
    }

    if (room.status === "completed") {
      return Response.json({ error: "Room session has ended" }, { status: 410 });
    }

    // Check if already joined
    const { data: existing } = await supabase
      .from("study_room_participants")
      .select("id, current_level")
      .eq("room_id", room.id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return Response.json({
        success: true,
        alreadyJoined: true,
        participantId: existing.id,
        currentLevel: existing.current_level,
      });
    }

    // Check capacity
    const { count } = await supabase
      .from("study_room_participants")
      .select("id", { count: "exact", head: true })
      .eq("room_id", room.id);

    if ((count || 0) >= room.max_participants) {
      return Response.json({ error: "Room is full" }, { status: 409 });
    }

    // Join room
    const { data: participant, error: joinError } = await supabase
      .from("study_room_participants")
      .insert({
        room_id: room.id,
        user_id: user.id,
        display_name: displayName,
        current_level: 0,
      })
      .select("id")
      .single();

    if (joinError) throw joinError;

    return Response.json({
      success: true,
      alreadyJoined: false,
      participantId: participant.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
