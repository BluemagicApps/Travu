import { prisma } from "@/lib/db/prisma";
import type { Dataset } from "./types";

export interface AirportOption {
  iata: string;
  city: string;
  name: string;
  country: string;
}

// Airports/airlines/routes are static reference data that only changes on reseed.
// Memoise the dataset in-process so a single search page (1 main leg + 7 price-strip
// days = many searchLeg calls) hits the remote DB once instead of ~24 times.
const DATASET_TTL_MS = 10 * 60 * 1000;
let datasetCache: { at: number; promise: Promise<Dataset> } | null = null;

async function fetchDataset(): Promise<Dataset> {
  const [airports, airlines, routes] = await Promise.all([
    prisma.airport.findMany(),
    prisma.airline.findMany(),
    prisma.routeServed.findMany(),
  ]);
  return {
    airports: new Map(airports.map((a) => [a.iata, a])),
    airlines: new Map(
      airlines.map((a) => [a.iata, { iata: a.iata, name: a.name, brandColor: a.brandColor }]),
    ),
    routes: routes.map((r) => ({
      airlineIata: r.airlineIata,
      originIata: r.originIata,
      destIata: r.destIata,
    })),
  };
}

export function loadDataset(): Promise<Dataset> {
  const now = Date.now();
  if (datasetCache && now - datasetCache.at < DATASET_TTL_MS) {
    return datasetCache.promise;
  }
  const promise = fetchDataset().catch((e) => {
    // Don't cache a failed load.
    datasetCache = null;
    throw e;
  });
  datasetCache = { at: now, promise };
  return promise;
}

/** Clear the in-process dataset cache (e.g. after a reseed in dev). */
export function __resetDataset(): void {
  datasetCache = null;
}

export async function getAirportOptions(): Promise<AirportOption[]> {
  // Derive from the cached dataset so we don't issue an extra DB query.
  const ds = await loadDataset();
  return [...ds.airports.values()]
    .map((a) => ({ iata: a.iata, city: a.city, name: a.name, country: a.country }))
    .sort((x, y) => x.city.localeCompare(y.city));
}
