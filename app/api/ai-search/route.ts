import { type NextRequest, NextResponse } from "next/server";
import { parseQuery } from "@/lib/ai/searchParser";
import { getAirportOptions, loadDataset } from "@/lib/flights/dataset";
import { searchFlights } from "@/lib/flights/engine";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { query?: unknown };
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json({ error: "missing_query" }, { status: 400 });
  }

  const airports = await getAirportOptions();
  const parsed = await parseQuery(query, airports);

  if (!parsed.ok) {
    return NextResponse.json({ needsClarification: true, message: parsed.message });
  }

  const ds = await loadDataset();
  const result = searchFlights(parsed.filter, ds);
  return NextResponse.json({ filter: parsed.filter, ...result });
}
