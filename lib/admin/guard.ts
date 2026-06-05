import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/roles";

/**
 * Server-side admin guard (defence in depth — middleware also gates these paths).
 * Use requireAdminApi() in /api/admin routes and isAdminSession() in /admin pages.
 */
export async function requireAdminApi(): Promise<
  { ok: true; userId: string } | { ok: false; res: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, res: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (!isAdmin(session.user.role)) {
    return { ok: false, res: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId: session.user.id };
}

export async function isAdminSession(): Promise<boolean> {
  const session = await auth();
  return Boolean(session?.user?.id && isAdmin(session.user.role));
}
