import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, EMAIL_FROM } from "@/lib/resend";

function daysFromAmount(amount: number): number {
  return Math.round((amount / 5) * 30);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function invoiceEmail(opts: {
  email: string;
  amount: number;
  days: number;
  expiresAt: Date;
  isExtension: boolean;
}): string {
  const { amount, days, expiresAt, isExtension } = opts;
  const expiryStr = formatDate(expiresAt);
  const months = (days / 30).toFixed(1).replace(".0", "");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <div style="display:inline-block;background:linear-gradient(135deg,#34d399,#10b981);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
            ✦ Teach Me Like I'm 10
          </div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#111;border:1px solid #1a2e1f;border-radius:20px;padding:36px 32px;">

          <!-- Checkmark -->
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:50%;background:rgba(52,211,153,0.1);border:2px solid rgba(52,211,153,0.3);">
              <span style="font-size:24px;">✓</span>
            </div>
          </div>

          <h1 style="color:#fff;font-size:24px;font-weight:700;text-align:center;margin:0 0 8px;">
            ${isExtension ? "Pro Extended!" : "Welcome to Pro!"} 🎉
          </h1>
          <p style="color:rgba(255,255,255,0.45);font-size:14px;text-align:center;margin:0 0 32px;">
            ${isExtension ? "Your subscription has been extended." : "Your Pro access is now active."}
          </p>

          <!-- Receipt -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;margin-bottom:24px;">
            <tr>
              <td style="color:rgba(255,255,255,0.4);font-size:13px;padding:6px 0;">Amount paid</td>
              <td align="right" style="color:#34d399;font-size:13px;font-weight:600;padding:6px 0;">$${amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color:rgba(255,255,255,0.4);font-size:13px;padding:6px 0;">Pro access granted</td>
              <td align="right" style="color:#fff;font-size:13px;font-weight:600;padding:6px 0;">${days} days (${months} month${parseFloat(months) !== 1 ? "s" : ""})</td>
            </tr>
            <tr>
              <td style="color:rgba(255,255,255,0.4);font-size:13px;padding:6px 0;border-top:1px solid rgba(255,255,255,0.06);">Expires</td>
              <td align="right" style="color:#fff;font-size:13px;font-weight:600;padding:6px 0;border-top:1px solid rgba(255,255,255,0.06);">${expiryStr}</td>
            </tr>
          </table>

          <p style="color:rgba(255,255,255,0.35);font-size:12px;text-align:center;margin:0 0 24px;">
            Donate again anytime to extend your subscription. Every $5 = 30 more days.
          </p>

          <!-- CTA -->
          <div style="text-align:center;">
            <a href="https://www.teachmelikeim10.xyz" style="display:inline-block;background:linear-gradient(135deg,#34d399,#10b981);color:#000;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:12px;">
              Start Learning →
            </a>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0;">
            Teach Me Like I'm 10 · teachmelikeim10.xyz<br>
            Questions? Reply to this email.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const raw = formData.get("data");
    if (!raw || typeof raw !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payload = JSON.parse(raw);

    const expectedToken = process.env.KOFI_WEBHOOK_TOKEN;
    if (!expectedToken) {
      console.error("KOFI_WEBHOOK_TOKEN env var is not set — rejecting all webhook calls");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    if (payload.verification_token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email: string = (payload.email ?? "").toLowerCase().trim();
    const amount: number = parseFloat(payload.amount ?? "0");
    const currency: string = payload.currency ?? "USD";
    const fromName: string = payload.from_name ?? "there";

    if (!email || amount <= 0) {
      return NextResponse.json({ error: "Missing email or amount" }, { status: 400 });
    }

    const usdAmount = currency === "USD" ? amount : amount;
    const days = daysFromAmount(usdAmount);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("kofi_payments")
      .select("pro_expires_at")
      .eq("email", email)
      .single();

    let finalExpiry = expiresAt;
    let isExtension = false;

    if (existing?.pro_expires_at) {
      const currentExpiry = new Date(existing.pro_expires_at);
      if (currentExpiry > now) {
        finalExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
        isExtension = true;
      }
    }

    await supabase.from("kofi_payments").upsert(
      {
        email,
        amount: usdAmount,
        days_granted: days,
        pro_expires_at: finalExpiry.toISOString(),
        last_payment_at: now.toISOString(),
      },
      { onConflict: "email" }
    );

    // Send invoice email
    try {
      const resend = getResend();
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: `Your Pro receipt — ${days} days unlocked ✦`,
        html: invoiceEmail({ email, amount: usdAmount, days, expiresAt: finalExpiry, isExtension }),
        replyTo: "hello@teachmelikeim10.xyz",
      });
    } catch (emailErr) {
      // Don't fail the webhook if email fails
      console.error("Invoice email failed:", emailErr);
    }

    console.log(`Ko-fi: ${fromName} <${email}> donated $${usdAmount} → ${days} days (expires ${finalExpiry.toISOString()})`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Ko-fi webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
