import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET — all reactions for a room (aggregated by level + emoji)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    const { data: room } = await supabase
      .from("study_rooms")
      .select("id")
      .eq("code", code.toUpperCase())
      .single();

    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });

    const { data: reactions } = await supabase
      .from("room_reactions")
      .select("id, user_id, level, emoji")
      .eq("room_id", room.id);

    // Aggregate: { [level]: { [emoji]: { count, userReacted } } }
    const aggregated: Record<number, Record<string, { count: number; userReacted: boolean }>> = {};
    for (const r of reactions || []) {
      if (!aggregated[r.level]) aggregated[r.level] = {};
      if (!aggregated[r.level][r.emoji]) aggregated[r.level][r.emoji] = { count: 0, userReacted: false };
      aggregated[r.level][r.emoji].count++;
      if (user && r.user_id === user.id) aggregated[r.level][r.emoji].userReacted = true;
    }

    return Response.json({ reactions: aggregated });
  } catch {
    return Response.json({ reactions: {} });
  }
}

// POST — toggle a reaction (insert if not exists, delete if exists)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { level, emoji } = await request.json();

    if (typeof level !== "number" || !emoji) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
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

    // Check if reaction already exists
    const { data: existing } = await supabase
      .from("room_reactions")
      .select("id")
      .eq("room_id", room.id)
      .eq("user_id", user.id)
      .eq("level", level)
      .eq("emoji", emoji)
      .single();

    if (existing) {
      await supabase.from("room_reactions").delete().eq("id", existing.id);
      return Response.json({ action: "removed" });
    } else {
      await supabase.from("room_reactions").insert({
        room_id: room.id,
        user_id: user.id,
        level,
        emoji,
      });
      return Response.json({ action: "added" });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
