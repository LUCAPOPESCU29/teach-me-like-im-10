import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

    const admin = createAdminClient();

    // Get paginated auth users
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({
      page,
      perPage: limit,
    });

    if (authError) throw authError;

    const authUsers = authData?.users ?? [];

    // Collect all user IDs for batch fetching
    const userIds = authUsers.map((u) => u.id);

    // Batch fetch profiles
    const { data: profiles } = userIds.length
      ? await admin.from("profiles").select("id, display_name, total_xp, streak_count").in("id", userIds)
      : { data: [] };

    // Batch fetch ko-fi payments by email
    const emails = authUsers.map((u) => u.email).filter(Boolean) as string[];
    const { data: payments } = emails.length
      ? await admin
          .from("kofi_payments")
          .select("email, pro_expires_at, amount")
          .in("email", emails)
      : { data: [] };

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const paymentMap = new Map((payments ?? []).map((p) => [p.email?.toLowerCase(), p]));

    const now = Date.now();

    let users = authUsers.map((u) => {
      const profile = profileMap.get(u.id);
      const payment = paymentMap.get(u.email?.toLowerCase() ?? "");
      const proExpires = payment?.pro_expires_at ? new Date(payment.pro_expires_at).getTime() : 0;
      const isPro = proExpires > now;
      const daysLeft = isPro ? Math.ceil((proExpires - now) / 86_400_000) : 0;

      return {
        id: u.id,
        email: u.email ?? "",
        displayName: profile?.display_name ?? "",
        totalXp: profile?.total_xp ?? 0,
        streak: profile?.streak_count ?? 0,
        createdAt: u.created_at,
        isPro,
        proExpiresAt: payment?.pro_expires_at ?? null,
        daysLeft,
        proSource: payment ? (payment.amount === 0 ? "promo" : "kofi") : null,
      };
    });

    // Filter by search
    if (search) {
      const s = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(s) ||
          u.displayName.toLowerCase().includes(s)
      );
    }

    return NextResponse.json({ users, total: authData?.total ?? authUsers.length });
  } catch (err) {
    console.error("admin/users error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
