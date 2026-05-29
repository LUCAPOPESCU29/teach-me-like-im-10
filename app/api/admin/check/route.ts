import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ isAdmin: false }, { status: 403 });
  return NextResponse.json({ isAdmin: true });
}
