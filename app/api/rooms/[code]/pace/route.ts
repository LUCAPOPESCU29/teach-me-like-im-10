import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST — host advances the room's synced level
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { level } = await request.json();

    if (typeof level !== "number" || level < 1 || level > 5) {
      return Response.json({ error: "Invalid level" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

    const { data: room } = await supabase
      .from("study_rooms")
      .select("id, host_id")
      .eq("code", code.toUpperCase())
      .single();

    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
    if (room.host_id !== user.id) return Response.json({ error: "Only the host can set the pace" }, { status: 403 });

    const { error: updateError } = await supabase
      .from("study_rooms")
      .update({ host_level: level })
      .eq("id", room.id);

    if (updateError) throw updateError;

    return Response.json({ success: true, hostLevel: level });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
