import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim();

  if (!name || name.length < 2) {
    return Response.json({ available: false, reason: "Too short" });
  }

  if (name.length > 30) {
    return Response.json({ available: false, reason: "Too long" });
  }

  if (!/^[a-zA-Z0-9 _-]+$/.test(name)) {
    return Response.json({
      available: false,
      reason: "Only letters, numbers, spaces, hyphens, and underscores",
    });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .ilike("display_name", name)
    .limit(1);

  return Response.json({
    available: !data || data.length === 0,
    reason: data && data.length > 0 ? "Already taken" : null,
  });
}
