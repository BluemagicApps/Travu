import { type FlightFilter, type Leg } from "@/lib/ai/schema";
import { applyFilters, type SearchResult } from "./engine";
import { getProvider } from "./provider";
import { MockProvider } from "./mock/provider";
import { cacheOffers } from "./offer-cache";

/** Cap on results per leg — keeps the cheapest N to bound caching + render cost. */
const MAX_RESULTS = 200;

export async function searchLeg(filter: FlightFilter, leg: Leg): Promise<SearchResult> {
  const provider = getProvider();
  // No nonStop constraint: return all stops so the sidebar (client-side) can filter them.
  const legParams = {
    origin: leg.origin,
    dest: leg.dest,
    date: leg.date,
    cabin: filter.cabin,
    passengers: filter.passengers,
    children: filter.children,
    infants: filter.infants,
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
  // Apply only non-sidebar filters here (budget/time windows from AI queries);
  // stops / airlines / sort are applied client-side in ResultsView so toggling a
  // box filters the curated list instantly without re-running the provider search.
  const serverFilter = { ...filter, maxStops: undefined, airlines: undefined };
  const filtered = applyFilters(flights, serverFilter);
  return { flights: filtered, count: filtered.length };
}

export function providerKind(): "amadeus" | "duffel" | "mock" {
  return getProvider().kind;
}
