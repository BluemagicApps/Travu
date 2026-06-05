import { type NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { parsePage } from "@/lib/admin/pagination";
import { listBookings, type VerticalFilter } from "@/lib/admin/bookings";

export const runtime = "nodejs";

const VERTICALS: VerticalFilter[] = ["all", "flight", "stay", "car"];

export async function GET(req: NextRequest) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.res;
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const vRaw = (sp.get("vertical") ?? "all") as VerticalFilter;
  const vertical = VERTICALS.includes(vRaw) ? vRaw : "all";
  const p = parsePage((k) => sp.get(k));
  return NextResponse.json(await listBookings({ q, vertical, p }));
}
