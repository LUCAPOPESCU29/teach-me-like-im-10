import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend";
import WelcomeEmail from "@/emails/WelcomeEmail";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.exchangeCodeForSession(code);

    // Send welcome email for new users
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at, display_name")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const createdAt = new Date(profile.created_at);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (createdAt > fiveMinutesAgo && session.user.email) {
          try {
            await resend.emails.send({
              from: EMAIL_FROM,
              to: session.user.email,
              subject: "Welcome to Teach Me Like I'm 10!",
              react: WelcomeEmail({ displayName: profile.display_name }),
            });
          } catch (e) {
            console.error("Failed to send welcome email:", e);
          }
        }
      }
    }
  }

  const next = searchParams.get("next") || "/";
  return NextResponse.redirect(`${origin}${next}`);
}
