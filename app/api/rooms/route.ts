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

// POST — Create a study room
export async function POST(request: Request) {
  try {
    const { topicName, topicSlug } = await request.json();

    if (!topicName || !topicSlug) {
      return Response.json({ error: "Missing topic name or slug" }, { status: 400 });
    }

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

    const hostName = profile?.display_name || "Learner";

    // Generate unique code (retry on collision)
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from("study_rooms")
        .select("id")
        .eq("code", code)
        .single();
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    // Create room
    const { data: room, error: insertError } = await supabase
      .from("study_rooms")
      .insert({
        code,
        topic_name: topicName,
        topic_slug: topicSlug,
        host_id: user.id,
        host_name: hostName,
      })
      .select("id, code")
      .single();

    if (insertError) throw insertError;

    // Add host as first participant
    await supabase.from("study_room_participants").insert({
      room_id: room.id,
      user_id: user.id,
      display_name: hostName,
      current_level: 0,
    });

    return Response.json({ code: room.code, roomId: room.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    // Gracefully handle missing table
    if (message.includes("relation") && message.includes("does not exist")) {
      return Response.json({ error: "Study rooms are being set up. Check back soon!" }, { status: 503 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

// GET — List active rooms
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: rooms, error: queryError } = await supabase
      .from("study_rooms")
      .select("id, code, topic_name, topic_slug, host_name, max_participants, status, created_at, expires_at")
      .in("status", ["waiting", "active"])
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(20);

    // If table doesn't exist yet, return empty
    if (queryError) {
      return Response.json({ rooms: [] });
    }

    // Get participant counts for each room
    const roomsWithCounts = await Promise.all(
      (rooms || []).map(async (room) => {
        const { count } = await supabase
          .from("study_room_participants")
          .select("id", { count: "exact", head: true })
          .eq("room_id", room.id);

        return {
          id: room.id,
          code: room.code,
          topicName: room.topic_name,
          topicSlug: room.topic_slug,
          hostName: room.host_name,
          maxParticipants: room.max_participants,
          participantCount: count || 0,
          status: room.status,
          createdAt: room.created_at,
        };
      })
    );

    return Response.json({ rooms: roomsWithCounts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ rooms: [] });
  }
}
