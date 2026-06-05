import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { getOverview } from "@/lib/admin/stats";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.res;
  return NextResponse.json(await getOverview());
}
