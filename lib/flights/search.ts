import { type FlightFilter, type Leg } from "@/lib/ai/schema";
import { applyFilters, type SearchResult } from "./engine";
import { getProvider } from "./provider";
import { MockProvider } from "./mock/provider";
import { cacheOffers } from "./offer-cache";

/** Cap on results per leg — keeps the cheapest N to bound caching + render cost. */
const MAX_RESULTS = 68;

export async function searchLeg(filter: FlightFilter, leg: Leg): Promise<SearchResult> {
  const provider = getProvider();
  const legParams = {
    origin: leg.origin,
    dest: leg.dest,
    date: leg.date,
    cabin: filter.cabin,
    passengers: filter.passengers,
    nonStop: filter.maxStops === 0,
  };
  let flights = [] as Awaited<ReturnType<typeof provider.searchLeg>>;
  try {
    flights = await provider.searchLeg(legParams);
    // Keep the cheapest MAX_RESULTS so we cache/map/render a bounded set.
    if (flights.length > MAX_RESULTS) {
      flights = [...flights].sort((a, b) => a.fare.total - b.fare.total).slice(0, MAX_RESULTS);
    }
    if (provider.kind !== "mock") await cacheOffers(flights);
  } catch (e) {
    if (provider.kind === "mock") throw e;
    console.error(`[search] ${provider.kind} provider failed; falling back to mock:`, e);
    flights = await new MockProvider().searchLeg(legParams);
  }
  const filtered = applyFilters(flights, filter);
  return { flights: filtered, count: filtered.length };
}

export function providerKind(): "amadeus" | "duffel" | "mock" {
  return getProvider().kind;
}
