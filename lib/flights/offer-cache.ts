import { prisma } from "@/lib/db/prisma";
import type { Flight } from "./types";

const TTL_MS = 30 * 60 * 1000;

export async function cacheOffers(flights: Flight[]): Promise<void> {
  if (flights.length === 0) return;
  await prisma.$transaction(
    flights.map((f) =>
      prisma.cachedOffer.upsert({
        where: { id: f.id },
        create: { id: f.id, payload: f as unknown as object },
        update: { payload: f as unknown as object },
      }),
    ),
  );
}

export async function getCachedOffer(id: string): Promise<Flight | null> {
  const row = await prisma.cachedOffer.findUnique({ where: { id } });
  if (!row) return null;
  if (Date.now() - row.createdAt.getTime() > TTL_MS) return null;
  return row.payload as unknown as Flight;
}
