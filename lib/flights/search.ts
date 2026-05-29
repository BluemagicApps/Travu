import { type FlightFilter, type Leg } from "@/lib/ai/schema";
import { applyFilters, type SearchResult } from "./engine";
import { getProvider } from "./provider";
import { MockProvider } from "./mock/provider";
import { cacheOffers } from "./offer-cache";

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
