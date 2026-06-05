import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/guard";
import { setUserRole } from "@/lib/admin/users";

export const runtime = "nodejs";

const Body = z.object({ role: z.enum(["USER", "ADMIN"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.res;
  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  await setUserRole(id, parsed.data.role);
  return NextResponse.json({ ok: true });
}
