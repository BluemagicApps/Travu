import { NextResponse } from "next/server";
import { searchLocations, type LocationSuggestion } from "@/lib/stays/data/locations";
import { getAirportOptions } from "@/lib/flights/dataset";

export const runtime = "nodejs";

/** Airport rows are derived from the flights dataset so "London (LHR – Heathrow)" appears. */
async function airportSuggestions(): Promise<LocationSuggestion[]> {
  try {
    const airports = await getAirportOptions();
    return airports.map((a) => ({
      id: `airport:${a.iata}`,
      kind: "airport" as const,
      primary: `${a.city} (${a.iata} – ${a.name})`,
      secondary: a.country,
      cityKey: a.city,
    }));
  } catch {
    return []; // DB unavailable — still serve city/area/landmark suggestions.
  }
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 1) return NextResponse.json({ results: [] });
  const results = searchLocations(q, await airportSuggestions(), 8);
  return NextResponse.json({ results });
}
