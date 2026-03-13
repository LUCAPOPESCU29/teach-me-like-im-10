import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const type = searchParams.get("type");

  if (!userId || !type || !["streak", "digest", "newsletter"].includes(type)) {
    return new Response("Invalid unsubscribe link", { status: 400 });
  }

  const admin = createAdminClient();
  const column =
    type === "streak"
      ? "email_streak_reminder"
      : type === "newsletter"
      ? "email_newsletter"
      : "email_weekly_digest";

  await admin.from("profiles").update({ [column]: false }).eq("id", userId);

  const label =
    type === "streak"
      ? "streak reminders"
      : type === "newsletter"
      ? "the weekly newsletter"
      : "weekly digests";

  return new Response(
    `<!DOCTYPE html>
    <html>
      <body style="background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;max-width:400px;padding:20px;">
          <div style="font-size:48px;margin-bottom:16px;">&#10003;</div>
          <h1 style="font-size:24px;margin-bottom:8px;">Unsubscribed</h1>
          <p style="color:#999;font-size:15px;margin-bottom:24px;">You&apos;ve been unsubscribed from ${label}.</p>
          <a href="https://teachmelikeim10.xyz" style="color:#4ade80;font-size:14px;">Back to learning</a>
        </div>
      </body>
    </html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
