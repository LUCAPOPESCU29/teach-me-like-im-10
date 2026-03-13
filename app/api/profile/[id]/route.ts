import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, total_xp, streak_count, created_at")
      .eq("id", id)
      .single();

    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    // Fetch topics explored
    const { data: topics } = await supabase
      .from("topic_progress")
      .select("slug, topic_name, max_level, lang, updated_at")
      .eq("user_id", id)
      .order("updated_at", { ascending: false })
      .limit(20);

    // Fetch badge data
    const topicList = topics || [];
    const topicsExplored = topicList.length;
    const maxLevelReached = Math.max(0, ...topicList.map((t) => t.max_level));
    const allFiveLevels = topicList.some((t) => t.max_level >= 5);
    const languagesUsed = new Set(topicList.map((t) => t.lang)).size;

    // Check quiz ace and teach back
    const { data: quizAceData } = await supabase
      .from("xp_events")
      .select("source")
      .eq("user_id", id)
      .eq("source", "quiz_ace")
      .limit(1);

    const { data: teachBackData } = await supabase
      .from("xp_events")
      .select("source")
      .eq("user_id", id)
      .eq("source", "teachback_pass")
      .limit(1);

    // Check topics in one day
    const { data: xpEvents } = await supabase
      .from("xp_events")
      .select("topic_slug, created_at")
      .eq("user_id", id)
      .eq("source", "level");

    let topicsInOneDay = 0;
    if (xpEvents) {
      const dayMap = new Map<string, Set<string>>();
      for (const ev of xpEvents) {
        if (!ev.topic_slug) continue;
        const day = ev.created_at.slice(0, 10);
        if (!dayMap.has(day)) dayMap.set(day, new Set());
        dayMap.get(day)!.add(ev.topic_slug);
      }
      for (const slugs of dayMap.values()) {
        topicsInOneDay = Math.max(topicsInOneDay, slugs.size);
      }
    }

    // Get rank
    const { count: higherCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gt("total_xp", profile.total_xp);

    const rank = (higherCount ?? 0) + 1;

    // Compute XP level
    const XP_LEVELS = [
      { xp: 0, title: "Curious Mind" },
      { xp: 100, title: "Quick Learner" },
      { xp: 300, title: "Knowledge Seeker" },
      { xp: 600, title: "Deep Thinker" },
      { xp: 1000, title: "Topic Master" },
      { xp: 1500, title: "Polymath" },
      { xp: 2500, title: "Renaissance Mind" },
    ];

    let level = 1;
    let title = "Curious Mind";
    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
      if (profile.total_xp >= XP_LEVELS[i].xp) {
        level = i + 1;
        title = XP_LEVELS[i].title;
        break;
      }
    }

    return Response.json({
      profile: {
        id: profile.id,
        displayName: profile.display_name,
        totalXP: profile.total_xp,
        streakCount: profile.streak_count,
        level,
        title,
        rank,
        joinedAt: profile.created_at,
      },
      topics: topicList.map((t) => ({
        slug: t.slug,
        name: t.topic_name,
        maxLevel: t.max_level,
        lang: t.lang,
      })),
      badgeData: {
        totalXP: profile.total_xp,
        streakCount: profile.streak_count,
        topicsExplored,
        maxLevelReached,
        quizAced: (quizAceData?.length || 0) > 0,
        teachBackPassed: (teachBackData?.length || 0) > 0,
        languagesUsed,
        topicsInOneDay,
        allFiveLevels,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
