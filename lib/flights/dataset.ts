import { prisma } from "@/lib/db/prisma";
import type { Dataset } from "./types";

export interface AirportOption {
  iata: string;
  city: string;
  name: string;
  country: string;
}

export async function getAirportOptions(): Promise<AirportOption[]> {
  const airports = await prisma.airport.findMany({ orderBy: { city: "asc" } });
  return airports.map((a) => ({
    iata: a.iata,
    city: a.city,
    name: a.name,
    country: a.country,
  }));
}

export async function loadDataset(): Promise<Dataset> {
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
