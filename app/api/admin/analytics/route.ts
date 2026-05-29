import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();

    // Signups by day — last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: authData } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    const recentUsers = (authData?.users ?? []).filter(
      (u) => new Date(u.created_at).toISOString() >= thirtyDaysAgo
    );

    // Group by date string
    const signupsByDayMap: Record<string, number> = {};
    // Pre-fill last 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      signupsByDayMap[key] = 0;
    }
    recentUsers.forEach((u) => {
      const key = new Date(u.created_at).toISOString().slice(0, 10);
      if (key in signupsByDayMap) {
        signupsByDayMap[key] = (signupsByDayMap[key] ?? 0) + 1;
      }
    });

    const signupsByDay = Object.entries(signupsByDayMap).map(([date, count]) => ({
      date,
      count,
    }));

    // Top topics — group by topic_name+slug client-side
    const { data: topicRows } = await admin
      .from("topic_progress")
      .select("topic_name, slug, user_id");

    const topicUserMap: Record<string, { topic_name: string; slug: string; users: Set<string> }> =
      {};
    (topicRows ?? []).forEach((row) => {
      const key = row.slug ?? row.topic_name;
      if (!topicUserMap[key]) {
        topicUserMap[key] = {
          topic_name: row.topic_name,
          slug: row.slug,
          users: new Set(),
        };
      }
      topicUserMap[key].users.add(row.user_id);
    });

    const topTopics = Object.values(topicUserMap)
      .map((t) => ({
        topic_name: t.topic_name,
        slug: t.slug,
        userCount: t.users.size,
      }))
      .sort((a, b) => b.userCount - a.userCount)
      .slice(0, 15);

    // XP distribution buckets
    const { data: xpRows } = await admin
      .from("profiles")
      .select("total_xp");

    const buckets = [
      { label: "0–99", min: 0, max: 99, count: 0 },
      { label: "100–299", min: 100, max: 299, count: 0 },
      { label: "300–599", min: 300, max: 599, count: 0 },
      { label: "600–999", min: 600, max: 999, count: 0 },
      { label: "1000–1499", min: 1000, max: 1499, count: 0 },
      { label: "1500–2499", min: 1500, max: 2499, count: 0 },
      { label: "2500+", min: 2500, max: Infinity, count: 0 },
    ];

    (xpRows ?? []).forEach((row) => {
      const xp = row.total_xp ?? 0;
      const bucket = buckets.find((b) => xp >= b.min && xp <= b.max);
      if (bucket) bucket.count++;
    });

    const xpDistribution = buckets.map(({ label, count }) => ({ label, count }));

    return NextResponse.json({
      signupsByDay,
      topTopics,
      xpDistribution,
    });
  } catch (err) {
    console.error("admin/analytics error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
