import { createClient } from "@/lib/supabase/server";
import { getDailyTopic } from "@/lib/daily-topics";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { score, total } = await request.json();
    const { date } = getDailyTopic();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ xpEarned: 100, alreadyCompleted: false, guest: true });
    }

    // Check if already completed
    const { data: existing } = await supabase
      .from("daily_challenge_completions")
      .select("id")
      .eq("user_id", user.id)
      .eq("challenge_date", date)
      .single();

    if (existing) {
      return Response.json({ xpEarned: 0, alreadyCompleted: true });
    }

    const xpEarned = 100;

    // Record completion
    await supabase.from("daily_challenge_completions").insert({
      user_id: user.id,
      challenge_date: date,
      score,
      total,
      xp_earned: xpEarned,
    });

    // Award XP
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_xp, streak_count, streak_last_date, streak_freezes")
      .eq("id", user.id)
      .single();

    if (profile) {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const lastDate = profile.streak_last_date;
      let streak = profile.streak_count;
      let freezesUsed = 0;

      if (lastDate === yesterday) {
        streak += 1;
      } else if (lastDate !== today) {
        // Missed day(s) — check for freeze
        if (streak > 0 && (profile.streak_freezes || 0) > 0) {
          streak += 1;
          freezesUsed = 1;
        } else {
          streak = 1;
        }
      }

      await supabase
        .from("profiles")
        .update({
          total_xp: profile.total_xp + xpEarned,
          streak_count: streak,
          streak_last_date: today,
          streak_freezes: Math.max((profile.streak_freezes || 0) - freezesUsed, 0),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      await supabase.from("xp_events").insert({
        user_id: user.id,
        amount: xpEarned,
        source: "daily_challenge",
        topic_slug: null,
      });
    }

    return Response.json({ xpEarned, alreadyCompleted: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
