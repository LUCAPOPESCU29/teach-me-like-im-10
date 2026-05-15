import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only gate the root path
  if (pathname !== "/") return NextResponse.next();

  // If user has already come through the lander, let them into the app
  const entered = request.cookies.get("entered_app")?.value === "1";
  if (entered) return NextResponse.next();

  // First-time visitor → send to lander
  return NextResponse.redirect(new URL("/landing/", request.url));
}

export const config = {
  matcher: ["/"],
};
