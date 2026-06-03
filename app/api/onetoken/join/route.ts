import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateMembership } from "@/lib/onetoken/membership";

export const runtime = "nodejs";

/** Enrol the signed-in user in OneToken (idempotent). */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const membership = await getOrCreateMembership(session.user.id);
  return NextResponse.json({ membership }, { status: 201 });
}
