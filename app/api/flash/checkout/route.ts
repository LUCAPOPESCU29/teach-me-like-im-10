import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getBase(): string {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const base = getBase();
  const clientId = process.env.PAYPAL_CLIENT_ID ?? "";
  const secret = process.env.PAYPAL_SECRET ?? "";
  const creds = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${base}/v1/oauth2/token`, {
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

const PLAN_CONFIG: Record<string, { amount: string; description: string }> = {
  "flash-pro": {
    amount: "3.50",
    description: "TM10 Flash Pro — Monthly",
  },
  "flash-exec": {
    amount: "12.00",
    description: "TM10 Flash Executive — Monthly",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();

    if (!plan || !PLAN_CONFIG[plan]) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'flash-pro' or 'flash-exec'." },
        { status: 400 }
      );
    }

    const { amount, description } = PLAN_CONFIG[plan];
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.teachmelikeim10.xyz";

    const token = await getAccessToken();

    const res = await fetch(`${getBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: amount },
            description,
          },
        ],
        application_context: {
          brand_name: "Teach Me Like I'm 10",
          landing_page: "BILLING",
          user_action: "PAY_NOW",
          return_url: `${siteUrl}/flash/upgrade?success=true&plan=${plan}&orderId=`,
          cancel_url: `${siteUrl}/flash/upgrade?cancelled=true`,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("PayPal Flash order error:", err);
      return NextResponse.json(
        { error: "Failed to create PayPal order", detail: err },
        { status: 500 }
      );
    }

    const order = await res.json();

    const approvalUrl = order.links?.find(
      (l: { rel: string; href: string }) => l.rel === "approve"
    )?.href;

    if (!approvalUrl) {
      return NextResponse.json({ error: "No approval URL returned by PayPal" }, { status: 500 });
    }

    // Append the real order id to the return_url so the capture page can read it
    const returnWithOrderId = `${siteUrl}/flash/upgrade?success=true&plan=${plan}&orderId=${order.id}`;

    // Re-patch isn't needed — we return the approval link directly and pass orderId separately
    return NextResponse.json({ url: approvalUrl, orderId: order.id });
  } catch (err) {
    console.error("Flash checkout route error:", err);
    return NextResponse.json(
      { error: "Internal error", detail: String(err) },
      { status: 500 }
    );
  }
}
