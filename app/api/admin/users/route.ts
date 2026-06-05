import { type NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { parsePage } from "@/lib/admin/pagination";
import { listUsers } from "@/lib/admin/users";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.res;
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const p = parsePage((k) => sp.get(k));
  return NextResponse.json(await listUsers(q, p));
}
