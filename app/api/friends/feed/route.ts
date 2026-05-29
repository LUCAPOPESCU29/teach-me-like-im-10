import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function mapSourceToDescription(
  source: string,
  topicSlug: string | null,
  amount: number
): string {
  const topic = topicSlug ? topicSlug.replace(/-/g, " ") : null;

  switch (source) {
    case "level_complete":
      return topic ? `reached a new level on ${topic}` : "reached a new level";
    case "quiz":
    case "quiz_ace":
      return topic ? `aced a quiz on ${topic}` : "aced a quiz";
    case "topic":
      return topic ? `learned about ${topic}` : "learned something new";
    case "streak":
      return `hit a streak milestone`;
    case "level":
      return topic ? `learned about ${topic}` : "leveled up";
    case "teachback_pass":
      return topic ? `taught back ${topic}` : "completed a teachback";
    case "daily":
      return "completed daily challenge";
    default:
      return `earned ${amount} XP`;
  }
}

// GET /api/friends/feed — activity feed from people you follow
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ feed: [] });

    // Get who the user follows
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (!follows || follows.length === 0) return Response.json({ feed: [] });

    const followingIds = follows.map((f) => f.following_id);

    // Get recent XP events from followed users (last 7 days)
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { data: events } = await supabase
      .from("xp_events")
      .select("user_id, amount, source, topic_slug, created_at")
      .in("user_id", followingIds)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(20);

    // Get display names for the users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", followingIds);

    const nameMap: Record<string, string> = {};
    for (const p of profiles || []) {
      nameMap[p.id] = p.display_name;
    }

    const feed = (events || []).map((e) => ({
      userId: e.user_id,
      displayName: nameMap[e.user_id] || "Learner",
      amount: e.amount,
      source: e.source,
      topicSlug: e.topic_slug,
      description: mapSourceToDescription(e.source, e.topic_slug, e.amount),
      createdAt: e.created_at,
    }));

    return Response.json({ feed });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
