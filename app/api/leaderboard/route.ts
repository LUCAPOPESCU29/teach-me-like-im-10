import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") || "all";
  const supabase = await createClient();

  if (period === "all") {
    // All-time: query profiles ordered by total_xp
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, total_xp, streak_count")
      .order("total_xp", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      entries: (data || []).map((d, i) => ({
        id: d.id,
        display_name: d.display_name,
        xp: d.total_xp,
        streak_count: d.streak_count,
        rank: i + 1,
      })),
    });
  }

  // For "month" or "week", aggregate xp_events
  const now = new Date();
  let since: Date;

  if (period === "week") {
    // Start of current week (Monday)
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    since.setHours(0, 0, 0, 0);
  } else {
    // Start of current month
    since = new Date(now.getFullYear(), now.getMonth(), 1);
    since.setHours(0, 0, 0, 0);
  }

  // Fetch xp_events since the start of the period
  const { data: events, error: eventsError } = await supabase
    .from("xp_events")
    .select("user_id, amount")
    .gte("created_at", since.toISOString());

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  // Aggregate by user_id
  const xpByUser: Record<string, number> = {};
  for (const e of events || []) {
    xpByUser[e.user_id] = (xpByUser[e.user_id] || 0) + e.amount;
  }

  // Sort by XP descending and take top 50
  const sorted = Object.entries(xpByUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50);

  if (sorted.length === 0) {
    return NextResponse.json({ entries: [] });
  }

  // Fetch profile info for these users
  const userIds = sorted.map(([uid]) => uid);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, streak_count")
    .in("id", userIds);

  const profileMap: Record<string, { display_name: string; streak_count: number }> = {};
  for (const p of profiles || []) {
    profileMap[p.id] = { display_name: p.display_name, streak_count: p.streak_count };
  }

  const entries = sorted.map(([uid, xp], i) => ({
    id: uid,
    display_name: profileMap[uid]?.display_name || "Learner",
    xp,
    streak_count: profileMap[uid]?.streak_count || 0,
    rank: i + 1,
  }));

  return NextResponse.json({ entries });
}
