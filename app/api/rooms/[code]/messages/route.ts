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
      .select("id")
      .eq("code", code.toUpperCase())
      .single();

    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });

    const { data: messages } = await supabase
      .from("room_messages")
      .select("id, user_id, display_name, content, created_at")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true })
      .limit(100);

    return Response.json({
      messages: (messages || []).map((m) => ({
        id: m.id,
        userId: m.user_id,
        displayName: m.display_name,
        content: m.content,
        createdAt: m.created_at,
      })),
    });
  } catch (error) {
    return Response.json({ messages: [] });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { content } = await request.json();

    if (!content?.trim() || content.length > 500) {
      return Response.json({ error: "Invalid message" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

    const { data: room } = await supabase
      .from("study_rooms")
      .select("id")
      .eq("code", code.toUpperCase())
      .single();

    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const { data: message, error: insertError } = await supabase
      .from("room_messages")
      .insert({
        room_id: room.id,
        user_id: user.id,
        display_name: profile?.display_name || "Learner",
        content: content.trim(),
      })
      .select("id, user_id, display_name, content, created_at")
      .single();

    if (insertError) throw insertError;

    return Response.json({
      message: {
        id: message.id,
        userId: message.user_id,
        displayName: message.display_name,
        content: message.content,
        createdAt: message.created_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
