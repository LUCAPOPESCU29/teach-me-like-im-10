import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createClient();

    const { data: share } = await supabase
      .from("shared_topics")
      .select("*")
      .eq("share_code", code.toLowerCase())
      .single();

    if (!share) {
      return Response.json({ error: "Share not found" }, { status: 404 });
    }

    return Response.json({
      shareCode: share.share_code,
      sharerName: share.sharer_name,
      topicSlug: share.topic_slug,
      topicName: share.topic_name,
      lang: share.lang,
      levels: share.levels,
      maxLevel: share.max_level,
      personalMessage: share.personal_message,
      createdAt: share.created_at,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
