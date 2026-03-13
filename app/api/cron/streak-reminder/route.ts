import { createAdminClient } from "@/lib/supabase/admin";
import { resend, EMAIL_FROM } from "@/lib/resend";
import StreakReminderEmail from "@/emails/StreakReminderEmail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  // Find users with active streaks who haven't been active today
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, streak_count")
    .eq("streak_last_date", yesterdayStr)
    .gt("streak_count", 0)
    .eq("email_streak_reminder", true);

  if (!profiles?.length) {
    return Response.json({ sent: 0 });
  }

  let sent = 0;
  for (const profile of profiles) {
    const {
      data: { user },
    } = await admin.auth.admin.getUserById(profile.id);
    if (!user?.email) continue;

    const unsubscribeUrl = `https://teachmelikeim10.xyz/api/email/unsubscribe?userId=${profile.id}&type=streak`;

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: `Don't lose your ${profile.streak_count}-day streak!`,
        react: StreakReminderEmail({
          displayName: profile.display_name,
          streakCount: profile.streak_count,
          unsubscribeUrl,
        }),
      });
      sent++;
    } catch (e) {
      console.error(`Failed to send streak reminder to ${profile.id}:`, e);
    }
  }

  return Response.json({ sent, total: profiles.length });
}
