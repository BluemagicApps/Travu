import { type FlightFilter, type Leg } from "@/lib/ai/schema";
import { applyFilters, type SearchResult } from "./engine";
import { getProvider } from "./provider";
import { cacheOffers } from "./offer-cache";

export async function searchLeg(filter: FlightFilter, leg: Leg): Promise<SearchResult> {
  const provider = getProvider();
  const flights = await provider.searchLeg({
    origin: leg.origin,
    dest: leg.dest,
    date: leg.date,
    cabin: filter.cabin,
    passengers: filter.passengers,
    nonStop: filter.maxStops === 0,
  });
  if (provider.kind !== "mock") await cacheOffers(flights);
  const filtered = applyFilters(flights, filter);
  return { flights: filtered, count: filtered.length };
}

export function providerKind(): "amadeus" | "duffel" | "mock" {
  return getProvider().kind;
}
