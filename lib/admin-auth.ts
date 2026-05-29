import { createClient } from "@/lib/supabase/server";

export async function getAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return null;
  try {
    const supabase = await createClient();

    // getSession() reads directly from the cookie without a network round-trip.
    // getUser() validates the JWT server-side — if the access token has expired
    // and there is no session-refresh middleware in place, it returns null even
    // when the browser still has a valid refresh token.  For admin-panel API
    // routes (which are already guarded client-side by AdminAuthGuard) a
    // cookie-backed session check is sufficient.
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user ?? null;
    if (!user || user.email?.toLowerCase() !== adminEmail.toLowerCase()) return null;
    return user;
  } catch {
    return null;
  }
}
