import { NextResponse } from "next/server";
import { getAirportOptions } from "@/lib/flights/dataset";
import { parseCarQuery } from "@/lib/cars/ai";
import { enforceRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "ai-car-search", 20, 60_000);
  if (limited) return limited;

  const { query } = (await req.json().catch(() => ({}))) as { query?: string };
  if (!query || !query.trim()) return NextResponse.json({ error: "empty_query" }, { status: 400 });
  const opts = await getAirportOptions();
  const cities = [...new Set(opts.map((o) => o.city))];
  const result = await parseCarQuery(query.trim(), cities);
  if (!result.ok) return NextResponse.json({ needsClarification: true, message: result.message });
  return NextResponse.json({ filter: result.filter });
}
