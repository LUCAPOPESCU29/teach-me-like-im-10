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

    // Total users from profiles
    const { count: totalUsers } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true });

    // Active pro
    const { count: activePro } = await admin
      .from("kofi_payments")
      .select("email", { count: "exact", head: true })
      .gt("pro_expires_at", new Date().toISOString());

    // Revenue this month
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: revenueRows } = await admin
      .from("kofi_payments")
      .select("amount")
      .gte("last_payment_at", firstOfMonth)
      .gt("amount", 0);

    const revenueThisMonth = (revenueRows ?? []).reduce(
      (sum, row) => sum + (row.amount ?? 0),
      0
    );

    // Active today
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { data: todayRows } = await admin
      .from("xp_events")
      .select("user_id")
      .gte("created_at", todayStart.toISOString());

    const activeToday = new Set((todayRows ?? []).map((r) => r.user_id)).size;

    // Active this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: weekRows } = await admin
      .from("xp_events")
      .select("user_id")
      .gte("created_at", weekAgo);

    const activeThisWeek = new Set((weekRows ?? []).map((r) => r.user_id)).size;

    // New signups this week
    const { data: authData } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    const newSignupsThisWeek = (authData?.users ?? []).filter((u) => {
      const created = new Date(u.created_at).getTime();
      return created >= Date.now() - 7 * 24 * 60 * 60 * 1000;
    }).length;

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      activePro: activePro ?? 0,
      revenueThisMonth,
      activeToday,
      activeThisWeek,
      newSignupsThisWeek,
    });
  } catch (err) {
    console.error("admin/stats error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
