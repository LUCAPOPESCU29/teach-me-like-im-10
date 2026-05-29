import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST — Update current user's level progress
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { level } = await request.json();

    if (typeof level !== "number" || level < 0 || level > 5) {
      return Response.json({ error: "Invalid level" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    // Find room
    const { data: room } = await supabase
      .from("study_rooms")
      .select("id")
      .eq("code", code.toUpperCase())
      .single();

    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Update participant's level
    const { error: updateError } = await supabase
      .from("study_room_participants")
      .update({ current_level: level })
      .eq("room_id", room.id)
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    // If room is in waiting status and someone starts learning, mark as active
    const { data: roomData } = await supabase
      .from("study_rooms")
      .select("status, host_id")
      .eq("id", room.id)
      .single();

    if (roomData?.status === "waiting" && level > 0) {
      await supabase
        .from("study_rooms")
        .update({ status: "active" })
        .eq("id", room.id);
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

// GET — Get all participants' progress (for polling)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createClient();

    // Find room
    const { data: room } = await supabase
      .from("study_rooms")
      .select("id, status")
      .eq("code", code.toUpperCase())
      .single();

    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    const { data: participants } = await supabase
      .from("study_room_participants")
      .select("id, user_id, display_name, current_level, joined_at")
      .eq("room_id", room.id)
      .order("joined_at", { ascending: true });

    return Response.json({
      status: room.status,
      participants: (participants || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        userId: p.user_id,
        displayName: p.display_name,
        currentLevel: p.current_level,
        joinedAt: p.joined_at,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
