import type { Flight } from "@/lib/flights/types";

export interface PriceBreakdown {
  airFare: number; // cents
  bookingFee: number; // cents
  taxesFees: number; // cents
  total: number; // cents
}

/**
 * Reconstruct a passenger-facing price breakdown that always sums exactly to the
 * amount actually charged (`total`). Taxes & fees come from the flight snapshot;
 * the air fare is the remainder so the figures reconcile to the total.
 */
export function priceBreakdown(flight: Flight, total: number, pax: number): PriceBreakdown {
  const taxesFees = (flight.fare.taxes + flight.fare.fees) * pax;
  const airFare = Math.max(0, total - taxesFees);
  return { airFare, bookingFee: 0, taxesFees, total };
}

/** Human card label that never exposes the full number, e.g. "VISA •••• 4242". */
export function maskedCard(method?: string | null, last4?: string | null): string {
  const brand = method && method !== "CARD" && method !== "CARD_SIM" ? method.toUpperCase() : "CARD";
  return `${brand} •••• ${last4 ?? "----"}`;
}

export interface SlipSegment {
  fromCity: string;
  fromIata: string;
  toCity: string;
  toIata: string;
  departIso: string;
  arriveIso: string;
  durationMin: number;
  airlineName: string;
  airlineIata: string;
  flightNo: string;
}

export interface SlipData {
  bookingRef: string;
  status: string;
  issuedIso: string;
  tripType: string;
  cabin: string;
  fareName: string;
  passengers: string[];
  routeFromCity: string;
  routeToCity: string;
  segments: SlipSegment[];
  breakdown: PriceBreakdown;
  paymentLabel: string;
}

export function buildSlip(p: {
  bookingRef: string;
  status: string;
  issuedIso: string;
  tripType: string;
  fareName: string;
  flight: Flight;
  total: number;
  passengerNames: string[];
  paymentMethod?: string | null;
  last4?: string | null;
  cityOf: (iata: string) => string;
}): SlipData {
  const segments: SlipSegment[] = p.flight.segments.map((s) => ({
    fromCity: p.cityOf(s.originIata),
    fromIata: s.originIata,
    toCity: p.cityOf(s.destIata),
    toIata: s.destIata,
    departIso: s.departIso,
    arriveIso: s.arriveIso,
    durationMin: s.durationMin,
    airlineName: s.airlineName,
    airlineIata: s.airlineIata,
    flightNo: s.flightNo,
  }));
  const first = segments[0];
  const last = segments[segments.length - 1];

  return {
    bookingRef: p.bookingRef,
    status: p.status,
    issuedIso: p.issuedIso,
    tripType: p.tripType,
    cabin: p.flight.cabin,
    fareName: p.fareName,
    passengers: p.passengerNames,
    routeFromCity: first?.fromCity ?? "",
    routeToCity: last?.toCity ?? "",
    segments,
    breakdown: priceBreakdown(p.flight, p.total, Math.max(1, p.passengerNames.length)),
    paymentLabel: maskedCard(p.paymentMethod, p.last4),
  };
}
