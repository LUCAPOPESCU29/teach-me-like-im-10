import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function getCodes(): Record<string, number> {
  const raw = process.env.DISCOUNT_CODES ?? "";
  const codes: Record<string, number> = {};
  for (const entry of raw.split(",")) {
    const [code, pct] = entry.trim().split(":");
    if (code && pct) codes[code.toUpperCase()] = parseInt(pct, 10);
  }
  return codes;
}

export async function POST(req: NextRequest) {
  try {
    const { code, plan } = await req.json();
    if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

    const codes = getCodes();
    const pct = codes[(code as string).toUpperCase().trim()];

    if (pct !== 100) {
      return NextResponse.json({ error: "Not a 100% code" }, { status: 400 });
    }

    // Require authentication — promo codes must be linked to a real account
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json(
        { error: "You must be signed in to redeem a promo code" },
        { status: 401 }
      );
    }

    const days = plan === "annual" ? 365 : 30;
    const now = new Date();
    const admin = createAdminClient();

    const userEmail = user.email.toLowerCase().trim();

    // If there's an existing record for this email, extend rather than reset
    let baseTime = now.getTime();
    const { data: existing } = await admin
      .from("kofi_payments")
      .select("pro_expires_at")
      .eq("email", userEmail)
      .single();

    if (existing?.pro_expires_at) {
      const currentExpiry = new Date(existing.pro_expires_at).getTime();
      if (currentExpiry > now.getTime()) baseTime = currentExpiry;
    }

    const expiresAt = new Date(baseTime + days * 24 * 60 * 60 * 1000);
    const email = userEmail;

    await admin
      .from("kofi_payments")
      .upsert(
        {
          email,
          amount: 0,
          days_granted: days,
          pro_expires_at: expiresAt.toISOString(),
          last_payment_at: now.toISOString(),
        },
        { onConflict: "email" }
      )
      .throwOnError();

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.getTime(),
      daysGranted: days,
      daysRemaining: days,
      linkedToAccount: true,
    });
  } catch (err) {
    console.error("promo-activate error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
