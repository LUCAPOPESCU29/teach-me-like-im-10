import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { checkBadges } from "@/lib/badges";

export const runtime = "nodejs";

const XP_LEVELS = [
  { xp: 0, title: "Curious Mind" },
  { xp: 100, title: "Quick Learner" },
  { xp: 300, title: "Knowledge Seeker" },
  { xp: 600, title: "Deep Thinker" },
  { xp: 1000, title: "Topic Master" },
  { xp: 1500, title: "Polymath" },
  { xp: 2500, title: "Renaissance Mind" },
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, total_xp, streak_count")
      .eq("id", id)
      .single();

    if (!profile) {
      return new Response("Not found", { status: 404 });
    }

    // Topics count
    const { data: topics } = await supabase
      .from("topic_progress")
      .select("slug, max_level, lang")
      .eq("user_id", id);

    const topicList = topics || [];
    const topicsExplored = topicList.length;
    const allFiveLevels = topicList.some((t) => t.max_level >= 5);
    const languagesUsed = new Set(topicList.map((t) => t.lang)).size;

    // Badge data
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

    const badges = checkBadges({
      totalXP: profile.total_xp,
      streakCount: profile.streak_count,
      topicsExplored,
      maxLevelReached: Math.max(0, ...topicList.map((t) => t.max_level)),
      quizAced: (quizAceData?.length || 0) > 0,
      teachBackPassed: (teachBackData?.length || 0) > 0,
      languagesUsed,
      topicsInOneDay,
      allFiveLevels,
    });

    const earnedBadges = badges.filter((b) => b.earned);

    // Rank
    const { count: higherCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gt("total_xp", profile.total_xp);

    const rank = (higherCount ?? 0) + 1;

    // XP level
    let title = "Curious Mind";
    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
      if (profile.total_xp >= XP_LEVELS[i].xp) {
        title = XP_LEVELS[i].title;
        break;
      }
    }

    const initial = profile.display_name.charAt(0).toUpperCase();

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0a1020 0%, #0d1a2d 50%, #0a1020 100%)",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            position: "relative",
          }}
        >
          {/* Glow effects */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              left: "-100px",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-100px",
              right: "-100px",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
              display: "flex",
            }}
          />

          {/* Avatar initial */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: "700",
              color: "white",
              marginBottom: "16px",
            }}
          >
            {initial}
          </div>

          {/* Name */}
          <div
            style={{
              fontSize: "42px",
              fontWeight: "700",
              color: "white",
              marginBottom: "4px",
              display: "flex",
            }}
          >
            {profile.display_name}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: "20px",
              color: "#4ade80",
              fontWeight: "600",
              marginBottom: "32px",
              display: "flex",
            }}
          >
            {title} · Rank #{rank}
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "40px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "16px 32px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: "700", color: "white", display: "flex" }}>
                {profile.total_xp.toLocaleString()}
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", display: "flex" }}>
                Total XP
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "16px 32px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: "700", color: "white", display: "flex" }}>
                {profile.streak_count}
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", display: "flex" }}>
                Day Streak
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "16px 32px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: "700", color: "white", display: "flex" }}>
                {topicsExplored}
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", display: "flex" }}>
                Topics
              </div>
            </div>
          </div>

          {/* Earned badges */}
          {earnedBadges.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "28px",
              }}
            >
              {earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  style={{
                    fontSize: "24px",
                    padding: "6px 10px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                    display: "flex",
                  }}
                >
                  {badge.icon}
                </div>
              ))}
            </div>
          )}

          {/* Branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              position: "absolute",
              bottom: "24px",
            }}
          >
            <div style={{ display: "flex", gap: "4px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", display: "flex" }} />
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#fbbf24", display: "flex" }} />
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f97316", display: "flex" }} />
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f43f5e", display: "flex" }} />
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#a855f7", display: "flex" }} />
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.3)",
                fontWeight: "500",
                letterSpacing: "1px",
                display: "flex",
              }}
            >
              TEACHMELIKEIM10.XYZ
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      }
    );
  } catch {
    return new Response("Error generating image", { status: 500 });
  }
}
