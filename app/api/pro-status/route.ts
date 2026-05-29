import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/pro-status
 * Returns the authenticated user's Pro status.
 * Checks kofi_payments by:
 *   1. The user's auth email (covers promo codes + kofi where emails match)
 *   2. A linked Ko-fi email stored in their profile (covers kofi where emails differ)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ isPro: false, expiresAt: null });
    }

    const admin = createAdminClient();
    const authEmail = user.email.toLowerCase().trim();

    // Collect all emails to check
    const emailsToCheck = new Set<string>([authEmail]);

    // Also check if the user has a linked Ko-fi email in their profile
    const { data: profile } = await admin
      .from("profiles")
      .select("kofi_email")
      .eq("id", user.id)
      .single();

    if (profile?.kofi_email) {
      emailsToCheck.add((profile.kofi_email as string).toLowerCase().trim());
    }

    // Query kofi_payments for any matching email
    const { data: payments } = await admin
      .from("kofi_payments")
      .select("pro_expires_at, email")
      .in("email", Array.from(emailsToCheck));

    if (!payments || payments.length === 0) {
      return NextResponse.json({ isPro: false, expiresAt: null });
    }

    // Find the latest non-expired expiry across all matching records
    const now = Date.now();
    let bestExpiry = 0;
    for (const row of payments) {
      const exp = new Date(row.pro_expires_at).getTime();
      if (exp > bestExpiry) bestExpiry = exp;
    }

    const isPro = bestExpiry > now;
    return NextResponse.json({ isPro, expiresAt: isPro ? bestExpiry : null });
  } catch {
    return NextResponse.json({ isPro: false, expiresAt: null });
  }
}

/**
 * POST /api/pro-status
 * Saves a linked Ko-fi email to the user's profile.
 * Used when the user's Ko-fi payment email differs from their account email.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { kofiEmail } = await req.json();
    if (!kofiEmail || typeof kofiEmail !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const cleanEmail = kofiEmail.toLowerCase().trim();
    const admin = createAdminClient();

    // Check the linked email actually has a pro record
    const { data: payment } = await admin
      .from("kofi_payments")
      .select("pro_expires_at")
      .eq("email", cleanEmail)
      .single();

    if (!payment?.pro_expires_at) {
      return NextResponse.json({ error: "No Pro record found for that email" }, { status: 404 });
    }

    const expiresAt = new Date(payment.pro_expires_at).getTime();
    if (expiresAt <= Date.now()) {
      return NextResponse.json({ error: "That Pro subscription has expired" }, { status: 400 });
    }

    // Save the linked Ko-fi email to the profile
    await admin
      .from("profiles")
      .update({ kofi_email: cleanEmail })
      .eq("id", user.id)
      .throwOnError();

    return NextResponse.json({ success: true, expiresAt });
  } catch (err) {
    console.error("pro-status POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
