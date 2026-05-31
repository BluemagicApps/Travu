import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Flight } from "./types";

const TTL_MS = 30 * 60 * 1000;

export async function cacheOffers(flights: Flight[]): Promise<void> {
  if (flights.length === 0) return;
  // Single round-trip insert (offer ids are unique) — far faster than N upserts
  // in a transaction, which dominated search latency for large result sets.
  await prisma.cachedOffer.createMany({
    data: flights.map((f) => ({ id: f.id, payload: f as unknown as Prisma.InputJsonValue })),
    skipDuplicates: true,
  });
}

export async function getCachedOffer(id: string): Promise<Flight | null> {
  const row = await prisma.cachedOffer.findUnique({ where: { id } });
  if (!row) return null;
  if (Date.now() - row.createdAt.getTime() > TTL_MS) return null;
  return row.payload as unknown as Flight;
}
