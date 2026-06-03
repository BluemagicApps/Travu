import type { Stay } from "../types";
import { cacheStayOffers } from "../offer-cache";
import { liteapiEnabled, liteGet, litePost } from "./client";
import { decodeLiteId } from "./ids";
import {
  buildStay,
  enrichWithDetail,
  type LiteHotel,
  type LiteHotelDetail,
  type LiteRateHotel,
} from "./map";

// The detail endpoint also carries location/class fields we use to rebuild a
// base Stay when the search cache has expired.
type LiteDetailFull = LiteHotelDetail &
  Pick<LiteHotel, "id" | "name" | "main_photo" | "stars" | "latitude" | "longitude" | "address" | "city">;

interface DetailResponse {
  data?: LiteDetailFull;
}
interface RatesResponse {
  data?: LiteRateHotel[];
}

async function fetchDetail(hotelId: string): Promise<LiteDetailFull | null> {
  try {
    const res = await liteGet<DetailResponse>("/data/hotel", { hotelId });
    return res.data ?? (res as unknown as LiteDetailFull);
  } catch {
    return null;
  }
}

async function fetchRate(hotelId: string, decoded: ReturnType<typeof decodeLiteId>): Promise<LiteRateHotel | undefined> {
  if (!decoded) return undefined;
  try {
    const res = await litePost<RatesResponse>("/hotels/rates", {
      hotelIds: [hotelId],
      checkin: decoded.checkIn,
      checkout: decoded.checkOut,
      currency: "USD",
      guestNationality: "US",
      occupancies: [{ adults: Math.max(1, decoded.adults), children: [] }],
    });
    return (res.data ?? [])[0];
  } catch {
    return undefined;
  }
}

/**
 * Resolve a LiteAPI stay for the detail/booking pages. Enriches the cached search
 * result with the full photo gallery + description; rebuilds it from a fresh rate
 * if the cache has expired. Re-caches the result so the booking step can read it.
 */
export async function resolveLiteStay(id: string, cached: Stay | null): Promise<Stay | null> {
  if (!liteapiEnabled()) return cached; // can't enrich without the key
  const decoded = decodeLiteId(id);
  if (!decoded) return cached;

  const detail = await fetchDetail(decoded.hotelId);

  let base = cached;
  if (!base) {
    // Cache expired — rebuild a base Stay from a fresh rate + detail static fields.
    const rate = await fetchRate(decoded.hotelId, decoded);
    const hotel: LiteHotel | null = detail
      ? {
          id: decoded.hotelId,
          name: detail.name ?? "Hotel",
          main_photo: detail.main_photo ?? detail.hotelImages?.[0]?.url,
          stars: detail.stars,
          rating: detail.rating,
          reviewCount: detail.reviewCount,
          latitude: detail.latitude,
          longitude: detail.longitude,
          address: detail.address,
          city: detail.city,
        }
      : null;
    base =
      hotel &&
      buildStay(hotel, rate, {
        destination: detail?.city ?? "",
        checkIn: decoded.checkIn,
        checkOut: decoded.checkOut,
        adults: decoded.adults,
        rooms: decoded.rooms,
      });
  }
  if (!base) return null;

  const enriched = detail ? enrichWithDetail(base, detail) : base;
  await cacheStayOffers([enriched]).catch(() => {});
  return enriched;
}
