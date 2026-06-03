import type { StayProvider } from "../provider";
import type { Stay, StayParams } from "../types";
import { liteGet, litePost } from "./client";
import { resolveLitePlace } from "./places";
import { buildStay, type LiteHotel, type LiteRateHotel } from "./map";

// Hotels priced per search (rates limit). The rates call is the slow leg; keep it
// modest. We over-fetch the static list so most rated hotels have name/photos.
const RATES_LIMIT = 24;
const LIST_LIMIT = 100;

interface HotelsResponse {
  data?: LiteHotel[];
}
interface RatesResponse {
  data?: LiteRateHotel[];
}

export class LiteApiStayProvider implements StayProvider {
  kind = "liteapi" as const;

  async searchStays(params: StayParams): Promise<Stay[]> {
    const place = resolveLitePlace(params.destination);
    // Unknown destination → throw so the seam falls back to the mock provider.
    if (!place) throw new Error("liteapi_unsupported_destination");

    // Static hotel list (names/photos/coords) and live rates run in PARALLEL —
    // rates accepts the city directly, so it doesn't depend on the list.
    const [hotelsRes, ratesRes] = await Promise.all([
      liteGet<HotelsResponse>("/data/hotels", {
        countryCode: place.countryCode,
        cityName: place.cityName,
        limit: LIST_LIMIT,
      }),
      litePost<RatesResponse>("/hotels/rates", {
        cityName: place.cityName,
        countryCode: place.countryCode,
        checkin: params.checkIn,
        checkout: params.checkOut,
        currency: "USD",
        guestNationality: "US",
        occupancies: [{ adults: Math.max(1, params.adults), children: [] }],
        limit: RATES_LIMIT,
      }),
    ]);

    const hotelsById = new Map((hotelsRes.data ?? []).map((h) => [h.id, h]));

    // Join: each rated hotel that we also have static content for becomes a result.
    const stays = (ratesRes.data ?? [])
      .map((rh) => {
        const hotel = hotelsById.get(rh.hotelId);
        return hotel ? buildStay(hotel, rh, params) : null;
      })
      .filter((s): s is Stay => s !== null);

    if (stays.length === 0) throw new Error("liteapi_no_rates");
    return stays;
  }
}
