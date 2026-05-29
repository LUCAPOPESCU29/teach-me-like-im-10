import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/friends?userId=xxx — get followers/following for a user
// GET /api/friends?check=followingId — check if current user follows someone
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const checkId = url.searchParams.get("check");
    const userId = url.searchParams.get("userId");

    // Check if current user follows someone
    if (checkId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return Response.json({ following: false });

      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", checkId)
        .single();

      return Response.json({ following: !!data });
    }

    // Get followers/following for a user
    if (userId) {
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from("follows")
          .select("follower_id, profiles!follows_follower_id_fkey(id, display_name, total_xp)")
          .eq("following_id", userId),
        supabase
          .from("follows")
          .select("following_id, profiles!follows_following_id_fkey(id, display_name, total_xp)")
          .eq("follower_id", userId),
      ]);

      const followers = (followersRes.data || []).map((f) => {
        const p = f.profiles as unknown as { id: string; display_name: string; total_xp: number };
        return { id: p.id, displayName: p.display_name, totalXP: p.total_xp };
      });

      const following = (followingRes.data || []).map((f) => {
        const p = f.profiles as unknown as { id: string; display_name: string; total_xp: number };
        return { id: p.id, displayName: p.display_name, totalXP: p.total_xp };
      });

      return Response.json({ followers, following });
    }

    return Response.json({ error: "Missing userId or check param" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/friends — follow a user
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const { followingId } = await request.json();
    if (!followingId) return Response.json({ error: "Missing followingId" }, { status: 400 });
    if (followingId === user.id) return Response.json({ error: "Cannot follow yourself" }, { status: 400 });

    await supabase.from("follows").upsert(
      { follower_id: user.id, following_id: followingId },
      { onConflict: "follower_id,following_id" }
    );

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

// DELETE /api/friends — unfollow a user
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const { followingId } = await request.json();
    if (!followingId) return Response.json({ error: "Missing followingId" }, { status: 400 });

    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId);

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
