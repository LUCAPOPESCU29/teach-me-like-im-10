import { createAdminClient } from "@/lib/supabase/admin";
import { resend, EMAIL_FROM } from "@/lib/resend";
import PasswordResetEmail from "@/emails/PasswordResetEmail";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Generate a recovery link without Supabase sending its own email
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: "https://teachmelikeim10.xyz/auth/reset-password",
      },
    });

    if (error || !data?.properties?.hashed_token) {
      // Don't reveal if the email exists or not
      return Response.json({ success: true });
    }

    // Build a direct reset URL with the token hash (bypasses Supabase's verify endpoint / PKCE)
    const resetUrl = `https://teachmelikeim10.xyz/auth/reset-password?token_hash=${data.properties.hashed_token}&type=recovery`;

    // Get user's display name
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", data.user.id)
      .single();

    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Reset your password — Teach Me Like I'm 10",
      react: PasswordResetEmail({
        displayName: profile?.display_name || "Learner",
        resetUrl,
      }),
    });

    return Response.json({ success: true });
  } catch {
    // Always return success to not reveal if email exists
    return Response.json({ success: true });
  }
}
