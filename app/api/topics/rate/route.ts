import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { slug, rating } = await request.json();

    if (!slug || !rating || rating < 1 || rating > 5) {
      return Response.json({ error: "Invalid rating" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Upsert user's rating
    await supabase.from("topic_ratings").upsert(
      {
        user_id: user.id,
        slug,
        rating: Math.round(rating),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,slug" }
    );

    // Get updated aggregate
    const { data: ratings } = await supabase
      .from("topic_ratings")
      .select("rating")
      .eq("slug", slug);

    const total = ratings?.length || 0;
    const avg =
      total > 0
        ? ratings!.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;

    return Response.json({
      userRating: Math.round(rating),
      avgRating: Math.round(avg * 10) / 10,
      totalRatings: total,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
