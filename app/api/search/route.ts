import { type NextRequest, NextResponse } from "next/server";
import { FlightFilter } from "@/lib/ai/schema";
import { searchFlights } from "@/lib/flights/engine";
import { loadDataset } from "@/lib/flights/dataset";

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = FlightFilter.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_filter", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const ds = await loadDataset();
  return NextResponse.json(searchFlights(parsed.data, ds));
}
