import { createAdminClient } from "@/lib/supabase/admin";
import { resend, EMAIL_FROM } from "@/lib/resend";
import WeeklyDigestEmail from "@/emails/WeeklyDigestEmail";
import { XP_LEVELS } from "@/lib/xp";
import { DAILY_TOPICS } from "@/lib/daily-topics";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const sinceStr = oneWeekAgo.toISOString();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, total_xp, streak_count")
    .eq("email_weekly_digest", true);

  if (!profiles?.length) {
    return Response.json({ sent: 0 });
  }

  let sent = 0;
  for (const profile of profiles) {
    const {
      data: { user },
    } = await admin.auth.admin.getUserById(profile.id);
    if (!user?.email) continue;

    // XP earned this week
    const { data: xpEvents } = await admin
      .from("xp_events")
      .select("amount")
      .eq("user_id", profile.id)
      .gte("created_at", sinceStr);

    const xpEarned = (xpEvents || []).reduce(
      (sum: number, e: { amount: number }) => sum + e.amount,
      0
    );

    // Topics explored this week
    const { data: topicsThisWeek } = await admin
      .from("topic_progress")
      .select("topic_name, slug, max_level")
      .eq("user_id", profile.id)
      .gte("updated_at", sinceStr);

    // Skip users with no activity
    if (xpEarned === 0 && (!topicsThisWeek || topicsThisWeek.length === 0)) {
      continue;
    }

    // Current title
    let currentTitle = "Curious Mind";
    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
      if (profile.total_xp >= XP_LEVELS[i].xp) {
        currentTitle = XP_LEVELS[i].title;
        break;
      }
    }

    // 3 random suggested topics
    const shuffled = [...DAILY_TOPICS].sort(() => Math.random() - 0.5);
    const suggestedTopics = shuffled.slice(0, 3);

    const unsubscribeUrl = `https://teachmelikeim10.xyz/api/email/unsubscribe?userId=${profile.id}&type=digest`;

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: `Your week in review: ${xpEarned} XP earned!`,
        react: WeeklyDigestEmail({
          displayName: profile.display_name,
          topicsThisWeek: (topicsThisWeek || []).map(
            (t: { topic_name: string; slug: string; max_level: number }) => ({
              name: t.topic_name,
              slug: t.slug,
              maxLevel: t.max_level,
            })
          ),
          xpEarned,
          totalXp: profile.total_xp,
          currentTitle,
          streakCount: profile.streak_count,
          suggestedTopics,
          unsubscribeUrl,
        }),
      });
      sent++;
    } catch (e) {
      console.error(`Failed to send weekly digest to ${profile.id}:`, e);
    }
  }

  return Response.json({ sent, total: profiles.length });
}
