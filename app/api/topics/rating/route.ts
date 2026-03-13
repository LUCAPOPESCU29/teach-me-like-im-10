import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return Response.json({ error: "slug is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get all ratings for this topic
    const { data: ratings } = await supabase
      .from("topic_ratings")
      .select("rating, user_id")
      .eq("slug", slug);

    const total = ratings?.length || 0;
    const avg =
      total > 0
        ? ratings!.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;

    // Find current user's rating
    const userRating = user
      ? ratings?.find((r) => r.user_id === user.id)?.rating || null
      : null;

    return Response.json({
      userRating,
      avgRating: total > 0 ? Math.round(avg * 10) / 10 : null,
      totalRatings: total,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
