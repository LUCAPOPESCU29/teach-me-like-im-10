import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();

  // Step 1: verify the Ko-fi secret token first
  const validToken = process.env.KOFI_SUCCESS_TOKEN;
  if (!validToken || !token || token !== validToken) {
    return NextResponse.json({ valid: false, error: "Invalid token" });
  }

  // Step 2: if email provided, look up their specific expiry
  if (email) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("kofi_payments")
      .select("pro_expires_at, amount, days_granted")
      .eq("email", email)
      .single();

    if (!data) {
      return NextResponse.json({
        valid: true,           // token is valid
        found: false,          // but no payment found for this email yet
        message: "No payment found for this email. It may take a moment to process.",
      });
    }

    const expiresAt = new Date(data.pro_expires_at).getTime();
    const now = Date.now();

    if (expiresAt < now) {
      return NextResponse.json({
        valid: true,
        found: true,
        expired: true,
        message: "Your Pro subscription has expired.",
      });
    }

    return NextResponse.json({
      valid: true,
      found: true,
      expired: false,
      expiresAt,                    // Unix ms — client stores this
      daysRemaining: Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)),
      amount: data.amount,
      daysGranted: data.days_granted,
    });
  }

  // Token valid, no email provided
  return NextResponse.json({ valid: true, found: false });
}
