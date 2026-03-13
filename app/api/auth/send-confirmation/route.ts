import { createAdminClient } from "@/lib/supabase/admin";
import { resend, EMAIL_FROM } from "@/lib/resend";
import ConfirmationEmail from "@/emails/ConfirmationEmail";

export async function POST(request: Request) {
  try {
    const { email, displayName } = await request.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password: crypto.randomUUID(),
      options: {
        redirectTo: "https://teachmelikeim10.xyz/auth/callback",
      },
    });

    if (error || !data?.properties?.action_link) {
      return Response.json(
        { error: "Failed to generate confirmation link" },
        { status: 500 }
      );
    }

    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Confirm your email — Teach Me Like I'm 10",
      react: ConfirmationEmail({
        displayName: displayName || "Learner",
        confirmUrl: data.properties.action_link,
      }),
    });

    return Response.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
