import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Stay } from "./types";

const TTL_MS = 30 * 60 * 1000;

export async function cacheStayOffers(stays: Stay[]): Promise<void> {
  if (stays.length === 0) return;
  await prisma.cachedOffer.createMany({
    data: stays.map((s) => ({ id: s.id, payload: s as unknown as Prisma.InputJsonValue })),
    skipDuplicates: true,
  });
}

export async function getCachedStay(id: string): Promise<Stay | null> {
  const row = await prisma.cachedOffer.findUnique({ where: { id } });
  if (!row) return null;
  if (Date.now() - row.createdAt.getTime() > TTL_MS) return null;
  return row.payload as unknown as Stay;
}
