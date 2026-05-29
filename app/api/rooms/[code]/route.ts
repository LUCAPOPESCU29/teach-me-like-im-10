import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createClient();

    const { data: room } = await supabase
      .from("study_rooms")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    const { data: participants } = await supabase
      .from("study_room_participants")
      .select("*")
      .eq("room_id", room.id)
      .order("joined_at", { ascending: true });

    const isExpired = new Date(room.expires_at) < new Date();

    return Response.json({
      room: {
        id: room.id,
        code: room.code,
        topicName: room.topic_name,
        topicSlug: room.topic_slug,
        hostId: room.host_id,
        hostName: room.host_name,
        maxParticipants: room.max_participants,
        status: room.status,
        createdAt: room.created_at,
        expiresAt: room.expires_at,
      },
      participants: (participants || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        userId: p.user_id,
        displayName: p.display_name,
        currentLevel: p.current_level,
        joinedAt: p.joined_at,
      })),
      isExpired,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
