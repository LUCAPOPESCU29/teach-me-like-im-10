import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/pro-users
 * Returns all users who currently have Pro, joined with auth data.
 * Only accessible by you (checks against ADMIN_EMAIL env var).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user?.email?.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();

    // Get all kofi_payments rows (real ones — exclude internal promo placeholders)
    const { data: payments, error } = await admin
      .from("kofi_payments")
      .select("email, pro_expires_at, amount, days_granted, last_payment_at")
      .not("email", "like", "%@internal")
      .order("pro_expires_at", { ascending: false });

    if (error) throw error;

    const now = Date.now();

    const rows = (payments ?? []).map((p) => {
      const expiresMs = new Date(p.pro_expires_at).getTime();
      const daysLeft = Math.max(0, Math.ceil((expiresMs - now) / 86_400_000));
      return {
        email: p.email,
        isPro: expiresMs > now,
        expiresAt: p.pro_expires_at,
        daysLeft,
        amount: p.amount,
        daysGranted: p.days_granted,
        lastPayment: p.last_payment_at,
        source: p.amount === 0 ? "promo" : "kofi",
      };
    });

    const active = rows.filter((r) => r.isPro);
    const expired = rows.filter((r) => !r.isPro);

    return NextResponse.json({
      totalActive: active.length,
      totalExpired: expired.length,
      active,
      expired,
    });
  } catch (err) {
    console.error("admin/pro-users error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
