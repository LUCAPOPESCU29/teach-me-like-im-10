import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();

    const { data: challenges, error } = await admin
      .from("friend_challenges")
      .select(
        "id, code, creator_name, topic_name, topic_slug, lang, created_at, expires_at, max_participants, challenge_participants(id)"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const result = (challenges ?? []).map((c) => ({
      id: c.id,
      code: c.code,
      creatorName: c.creator_name,
      topicName: c.topic_name,
      topicSlug: c.topic_slug,
      lang: c.lang,
      createdAt: c.created_at,
      expiresAt: c.expires_at,
      maxParticipants: c.max_participants,
      participantCount: Array.isArray(c.challenge_participants)
        ? c.challenge_participants.length
        : 0,
    }));

    return NextResponse.json({ challenges: result });
  } catch (err) {
    console.error("admin/challenges GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("friend_challenges")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("admin/challenges DELETE error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
