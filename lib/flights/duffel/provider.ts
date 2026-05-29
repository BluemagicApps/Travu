import { mapDuffelOffers, type DuffelOffersResponse } from "./mapOffers";
import type { FlightLegParams, FlightProvider, ProviderStatus } from "../provider";
import type { Cabin, Flight } from "../types";

const CABIN_CLASS: Record<Cabin, string> = {
  ECONOMY: "economy",
  PREMIUM: "premium_economy",
  BUSINESS: "business",
};
const DEFAULT_BRAND = "#0EA5E9";

export class DuffelProvider implements FlightProvider {
  kind = "duffel" as const;

  async searchLeg(params: FlightLegParams): Promise<Flight[]> {
    const token = process.env.DUFFEL_API_TOKEN ?? "";
    const version = process.env.DUFFEL_VERSION || "v2";
    const url = "https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=15000";
    const body = JSON.stringify({
      data: {
        slices: [{ origin: params.origin, destination: params.dest, departure_date: params.date }],
        passengers: Array.from({ length: Math.max(1, params.passengers) }, () => ({ type: "adult" })),
        cabin_class: CABIN_CLASS[params.cabin],
      },
    });
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Duffel-Version": version,
            Authorization: `Bearer ${token}`,
          },
          body,
        });
        if (!res.ok) throw new Error(`duffel_offer_request_failed_${res.status}`);
        const json = (await res.json()) as DuffelOffersResponse;
        return mapDuffelOffers(json, params.cabin, DEFAULT_BRAND);
      } catch (e) {
        lastErr = e;
        // brief backoff before retrying transient network errors
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
    throw lastErr;
  }

  async status(): Promise<ProviderStatus | null> {
    return null; // Duffel has no flight-status API; /track uses the synthetic fallback.
  }
}
