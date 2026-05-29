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

    const [totalResult, streakResult, digestResult, newsletterResult] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("email_streak_reminder", true),
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("email_weekly_digest", true),
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("email_newsletter", true),
    ]);

    return NextResponse.json({
      totalProfiles: totalResult.count ?? 0,
      streakReminder: streakResult.count ?? 0,
      weeklyDigest: digestResult.count ?? 0,
      newsletter: newsletterResult.count ?? 0,
    });
  } catch (err) {
    console.error("admin/emails error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
