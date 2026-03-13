import { createAdminClient } from "@/lib/supabase/admin";
import { resend, EMAIL_FROM } from "@/lib/resend";
import NewsletterEmail from "@/emails/NewsletterEmail";
import { DAILY_TOPICS } from "@/lib/daily-topics";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Pick a deterministic topic for this week
  const weekStr = getWeekString();
  const index = hashToIndex(weekStr, DAILY_TOPICS.length);
  const topicName = DAILY_TOPICS[index];
  const topicSlug = topicName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Fetch ALL users with newsletter preference on
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name")
    .eq("email_newsletter", true);

  if (!profiles?.length) {
    return Response.json({ sent: 0 });
  }

  let sent = 0;
  for (const profile of profiles) {
    const {
      data: { user },
    } = await admin.auth.admin.getUserById(profile.id);
    if (!user?.email) continue;

    const unsubscribeUrl = `https://teachmelikeim10.xyz/api/email/unsubscribe?userId=${profile.id}&type=newsletter`;

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: `This week: Learn about ${topicName}`,
        react: NewsletterEmail({
          displayName: profile.display_name,
          topicName,
          topicSlug,
          unsubscribeUrl,
        }),
      });
      sent++;
    } catch (e) {
      console.error(`Failed to send newsletter to ${profile.id}:`, e);
    }
  }

  return Response.json({ sent, total: profiles.length, topic: topicName });
}

function getWeekString(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  return `${now.getFullYear()}-W${week}`;
}

function hashToIndex(str: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}
