import { NextRequest, NextResponse } from "next/server";
import type { FlashTier } from "@/lib/flash-limits";

export const dynamic = "force-dynamic";

const BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID ?? ""}:${process.env.PAYPAL_SECRET ?? ""}`
  ).toString("base64");

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`PayPal auth failed (${res.status}): ${JSON.stringify(errBody)}`);
  }

  const data = await res.json();
  return data.access_token;
}

interface PlanMeta {
  tier: FlashTier;
  days: number;
}

const PLAN_META: Record<string, PlanMeta> = {
  "flash-pro": { tier: "pro", days: 30 },
  "flash-exec": { tier: "exec", days: 30 },
};

export async function POST(req: NextRequest) {
  try {
    const { orderId, plan } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    if (!plan || !PLAN_META[plan]) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'flash-pro' or 'flash-exec'." },
        { status: 400 }
      );
    }

    const { tier, days } = PLAN_META[plan];

    const token = await getAccessToken();

    const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("PayPal Flash capture error:", err);
      return NextResponse.json(
        { error: "Capture failed", detail: err },
        { status: 500 }
      );
    }

    const capture = await res.json();

    if (capture.status !== "COMPLETED") {
      return NextResponse.json(
        { success: false, status: capture.status },
        { status: 402 }
      );
    }

    const expiresAt = Date.now() + days * 86_400_000;

    return NextResponse.json({ success: true, tier, expiresAt });
  } catch (err) {
    console.error("Flash capture route error:", err);
    return NextResponse.json(
      { error: "Internal error", detail: String(err) },
      { status: 500 }
    );
  }
}
