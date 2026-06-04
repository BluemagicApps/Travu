import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Car } from "./types";

const TTL_MS = 30 * 60 * 1000;

export async function cacheCarOffers(cars: Car[]): Promise<void> {
  if (cars.length === 0) return;
  await prisma.cachedOffer.createMany({
    data: cars.map((c) => ({ id: c.id, payload: c as unknown as Prisma.InputJsonValue })),
    skipDuplicates: true,
  });
}

export async function getCachedCar(id: string): Promise<Car | null> {
  const row = await prisma.cachedOffer.findUnique({ where: { id } });
  if (!row) return null;
  if (Date.now() - row.createdAt.getTime() > TTL_MS) return null;
  return row.payload as unknown as Car;
}
