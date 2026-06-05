import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/edge";
import { isAdmin } from "@/lib/auth/roles";

/**
 * Gate /admin and /api/admin to authenticated ADMIN users. Runs on the Edge using
 * the token-only auth instance (no Prisma). This is the first line of defence;
 * every admin page/route also re-checks server-side via requireAdmin().
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/admin");
  const session = req.auth;

  if (!session?.user) {
    if (isApi) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (!isAdmin(session.user.role)) {
    if (isApi) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
