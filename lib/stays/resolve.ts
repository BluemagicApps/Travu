import { getCachedStay } from "./offer-cache";
import { generateStays } from "./mock/generator";
import { decodeStayId } from "./offer-id";
import { isLiteId } from "./liteapi/ids";
import { resolveLiteStay } from "./liteapi/detail";
import type { Stay } from "./types";

/** Resolve a stay by id: cached offer first, then regenerate from a decoded mock id. */
export async function resolveStay(id: string): Promise<Stay | null> {
  const cached = await getCachedStay(id);
  // LiteAPI stays: enrich the (possibly cached) result with the full photo
  // gallery + description from the hotel-detail endpoint.
  if (isLiteId(id)) return resolveLiteStay(id, cached);
  if (cached) return cached;
  const decoded = decodeStayId(id);
  if (!decoded) return null;
  return (
    generateStays({
      destination: decoded.destination,
      checkIn: decoded.checkIn,
      checkOut: decoded.checkOut,
      adults: 2,
      rooms: decoded.rooms,
    }).find((s) => s.id === id) ?? null
  );
}
