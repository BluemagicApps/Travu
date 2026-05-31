import { type NextRequest, NextResponse } from "next/server";
import { FlightFilter, type Leg, legsFromFilter } from "@/lib/ai/schema";
import { searchFlights, type SearchResult } from "@/lib/flights/engine";
import { loadDataset } from "@/lib/flights/dataset";
import type { Dataset } from "@/lib/flights/types";

function searchLeg(base: ReturnType<typeof FlightFilter.parse>, leg: Leg, ds: Dataset): SearchResult {
  return searchFlights(
    { ...base, origin: leg.origin, destination: leg.dest, departDate: leg.date },
    ds,
  );
}

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = FlightFilter.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_filter", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const filter = parsed.data;
  const ds = await loadDataset();
  const legs = legsFromFilter(filter);

  if (legs.length === 0) {
    return NextResponse.json({ tripType: filter.tripType, outbound: { flights: [], count: 0 } });
  }

  if (filter.tripType === "return" && legs.length >= 2) {
    return NextResponse.json({
      tripType: "return",
      outbound: searchLeg(filter, legs[0], ds),
      return: searchLeg(filter, legs[1], ds),
    });
  }

  if (filter.tripType === "multi-city") {
    return NextResponse.json({
      tripType: "multi-city",
      legs: legs.map((leg) => searchLeg(filter, leg, ds)),
    });
  }

  // one-way (default)
  return NextResponse.json({ tripType: "one-way", outbound: searchLeg(filter, legs[0], ds) });
}
