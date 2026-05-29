import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString("base64");

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error("Failed to get PayPal access token");
  const data = await res.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const token = await getAccessToken();

    const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("PayPal capture error:", err);
      return NextResponse.json({ error: "Capture failed" }, { status: 500 });
    }

    const capture = await res.json();
    const status = capture.status; // "COMPLETED"

    if (status !== "COMPLETED") {
      return NextResponse.json({ success: false, status });
    }

    // Extract amount from PayPal capture response
    const captureAmount = parseFloat(
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? "0"
    );
    // $5 = 30 days, $40 = 365 days (annual plan), scale proportionally
    const days = captureAmount >= 40
      ? 365
      : captureAmount > 0
        ? Math.round((captureAmount / 5) * 30)
        : 30;

    const now = new Date();
    let expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Record payment in DB and link to authenticated user if possible
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const userEmail = user.email.toLowerCase().trim();
        const admin = createAdminClient();

        // Extend if there's an existing active subscription
        const { data: existing } = await admin
          .from("kofi_payments")
          .select("pro_expires_at")
          .eq("email", userEmail)
          .single();

        if (existing?.pro_expires_at) {
          const currentExpiry = new Date(existing.pro_expires_at);
          if (currentExpiry > now) {
            expiresAt = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
          }
        }

        await admin.from("kofi_payments").upsert(
          {
            email: userEmail,
            amount: captureAmount,
            days_granted: days,
            pro_expires_at: expiresAt.toISOString(),
            last_payment_at: now.toISOString(),
          },
          { onConflict: "email" }
        );
      }
    } catch (dbErr) {
      // Don't fail the payment if DB write fails — expiry is still returned to client
      console.error("PayPal capture: failed to write kofi_payments:", dbErr);
    }

    return NextResponse.json({
      success: true,
      status,
      expiresAt: expiresAt.getTime(),
    });
  } catch (err) {
    console.error("PayPal capture route error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
