import { NextRequest, NextResponse } from "next/server";

function getBase() {
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

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json(); // "monthly" | "annual"

    const amount = plan === "annual" ? "40.00" : "5.00";
    const description =
      plan === "annual"
        ? "Teach Me Like I'm 10 — Pro Annual (save 33%)"
        : "Teach Me Like I'm 10 — Pro Monthly";

    const token = await getAccessToken();

    // Never trust the Origin header — always use the canonical site URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.teachmelikeim10.xyz";

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
          return_url: `${siteUrl}/checkout/success?plan=${plan}`,
          cancel_url: `${siteUrl}/checkout?plan=${plan}&cancelled=true`,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("PayPal order error:", err);
      return NextResponse.json({ error: "Failed to create order", detail: err }, { status: 500 });
    }

    const order = await res.json();
    const approvalUrl = order.links?.find(
      (l: { rel: string }) => l.rel === "approve"
    )?.href;

    if (!approvalUrl) {
      return NextResponse.json({ error: "No approval URL" }, { status: 500 });
    }

    return NextResponse.json({ url: approvalUrl, orderId: order.id });
  } catch (err) {
    console.error("PayPal order route error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}
