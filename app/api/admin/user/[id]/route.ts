import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const admin = createAdminClient();

    // Get auth user
    const { data: authUserData, error: authErr } = await admin.auth.admin.getUserById(id);
    if (authErr || !authUserData?.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const authUser = authUserData.user;

    // Get profile
    const { data: profile } = await admin
      .from("profiles")
      .select("id, display_name, total_xp, streak_count, streak_freezes, lang")
      .eq("id", id)
      .single();

    // Get last 10 XP events
    const { data: xpEvents } = await admin
      .from("xp_events")
      .select("amount, source, topic_slug, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get top 10 topics by max_level
    const { data: topics } = await admin
      .from("topic_progress")
      .select("topic_name, slug, max_level, updated_at")
      .eq("user_id", id)
      .order("max_level", { ascending: false })
      .limit(10);

    // Get pro status
    const email = authUser.email ?? "";
    const { data: payment } = await admin
      .from("kofi_payments")
      .select("email, pro_expires_at, amount, days_granted, last_payment_at")
      .eq("email", email)
      .maybeSingle();

    const now = Date.now();
    const proExpires = payment?.pro_expires_at ? new Date(payment.pro_expires_at).getTime() : 0;
    const isPro = proExpires > now;
    const daysLeft = isPro ? Math.ceil((proExpires - now) / 86_400_000) : 0;

    return NextResponse.json({
      id: authUser.id,
      email,
      createdAt: authUser.created_at,
      profile: profile ?? null,
      xpEvents: xpEvents ?? [],
      topics: topics ?? [],
      pro: {
        isPro,
        daysLeft,
        expiresAt: payment?.pro_expires_at ?? null,
        amount: payment?.amount ?? null,
        daysGranted: payment?.days_granted ?? null,
        lastPayment: payment?.last_payment_at ?? null,
        source: payment ? (payment.amount === 0 ? "promo" : "kofi") : null,
      },
    });
  } catch (err) {
    console.error("admin/user/[id] GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, days } = body;

    if (action !== "grant" || typeof days !== "number" || days < 1) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get auth user email
    const { data: authUserData, error: authErr } = await admin.auth.admin.getUserById(id);
    if (authErr || !authUserData?.user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const email = authUserData.user.email;

    // Check existing pro
    const { data: existing } = await admin
      .from("kofi_payments")
      .select("pro_expires_at")
      .eq("email", email)
      .maybeSingle();

    const now = Date.now();
    const existingExpires = existing?.pro_expires_at
      ? new Date(existing.pro_expires_at).getTime()
      : 0;

    // Extend from existing expiry if still active, otherwise from now
    const baseTime = existingExpires > now ? existingExpires : now;
    const newExpires = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

    await admin.from("kofi_payments").upsert(
      {
        email,
        pro_expires_at: newExpires,
        amount: 0,
        days_granted: days,
        last_payment_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    return NextResponse.json({ success: true, proExpiresAt: newExpires });
  } catch (err) {
    console.error("admin/user/[id] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const admin = createAdminClient();

    // Get auth user email
    const { data: authUserData, error: authErr } = await admin.auth.admin.getUserById(id);
    if (authErr || !authUserData?.user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const email = authUserData.user.email;

    // Set pro_expires_at to yesterday to revoke
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await admin
      .from("kofi_payments")
      .update({ pro_expires_at: yesterday })
      .eq("email", email);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("admin/user/[id] DELETE error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
