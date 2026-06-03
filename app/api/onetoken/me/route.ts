import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMembership } from "@/lib/onetoken/membership";

export const runtime = "nodejs";

/** Current user's OneToken status. Returns member:false for guests (no error) so
 *  the navbar badge can render a "Join" prompt without auth handling. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ authenticated: false, member: false });
  }
  const membership = await getMembership(session.user.id);
  return NextResponse.json({
    authenticated: true,
    member: Boolean(membership),
    membership,
  });
}
