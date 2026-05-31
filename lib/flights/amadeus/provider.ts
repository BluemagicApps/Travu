import { amadeusGet } from "./client";
import { mapOffers, type AmOffersResponse } from "./mapOffers";
import { mapStatus, type AmStatusResponse } from "./mapStatus";
import type { FlightLegParams, FlightProvider, ProviderStatus } from "../provider";
import type { Cabin, Flight } from "../types";

const TRAVEL_CLASS: Record<Cabin, string> = {
  ECONOMY: "ECONOMY",
  PREMIUM: "PREMIUM_ECONOMY",
  BUSINESS: "BUSINESS",
};

// Neutral brand color for real carriers (the UI tolerates a single accent).
const DEFAULT_BRAND = "#0EA5E9";

export class AmadeusProvider implements FlightProvider {
  kind = "amadeus" as const;

  async searchLeg(params: FlightLegParams): Promise<Flight[]> {
    const children = params.children ?? 0;
    const infants = params.infants ?? 0;
    const adults = Math.max(1, params.passengers - children - infants);
    const resp = await amadeusGet<AmOffersResponse>("/v2/shopping/flight-offers", {
      originLocationCode: params.origin,
      destinationLocationCode: params.dest,
      departureDate: params.date,
      adults,
      children: children || undefined,
      infants: infants || undefined,
      travelClass: TRAVEL_CLASS[params.cabin],
      nonStop: params.nonStop ? true : undefined,
      currencyCode: "USD",
      max: 30,
    });
    return mapOffers(resp, params.cabin, DEFAULT_BRAND);
  }

  async status(carrierIata: string, flightNo: string, date: string): Promise<ProviderStatus | null> {
    try {
      const resp = await amadeusGet<AmStatusResponse>("/v2/schedule/flights", {
        carrierCode: carrierIata,
        flightNumber: flightNo,
        scheduledDepartureDate: date,
      });
      return mapStatus(resp);
    } catch {
      return null;
    }
  }
}
