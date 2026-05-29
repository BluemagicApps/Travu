import type { Cabin, Fare, Flight, Segment } from "../types";
import { isoDurationToMinutes } from "../duration";

interface AmSegment {
  departure: { iataCode: string; at: string };
  arrival: { iataCode: string; at: string };
  carrierCode: string;
  number: string;
  duration?: string;
  numberOfStops?: number;
}
interface AmOffer {
  id: string;
  itineraries: { duration?: string; segments: AmSegment[] }[];
  price: { currency: string; base?: string; total?: string; grandTotal?: string };
  validatingAirlineCodes?: string[];
  numberOfBookableSeats?: number;
}
export interface AmOffersResponse {
  data: AmOffer[];
  dictionaries?: { carriers?: Record<string, string> };
}

function cents(value: string | undefined): number {
  return Math.round(Number(value ?? 0) * 100);
}


export function mapOffers(resp: AmOffersResponse, cabin: Cabin, brandColor: string): Flight[] {
  const carriers = resp.dictionaries?.carriers ?? {};
  const out: Flight[] = [];
  for (const offer of resp.data ?? []) {
    const itin = offer.itineraries?.[0];
    if (!itin || itin.segments.length === 0) continue;

    const segments: Segment[] = itin.segments.map((s) => ({
      airlineIata: s.carrierCode,
      airlineName: carriers[s.carrierCode] ?? s.carrierCode,
      flightNo: s.number,
      originIata: s.departure.iataCode,
      destIata: s.arrival.iataCode,
      departIso: s.departure.at,
      arriveIso: s.arrival.at,
      durationMin: isoDurationToMinutes(s.duration),
    }));

    const first = segments[0];
    const last = segments[segments.length - 1];
    const carrierIata = offer.validatingAirlineCodes?.[0] ?? first.airlineIata;
    const base = cents(offer.price.base);
    const total = cents(offer.price.grandTotal ?? offer.price.total);
    const fare: Fare = { base, taxes: Math.max(0, total - base), fees: 0, total };

    out.push({
      id: `amadeus:${crypto.randomUUID()}`,
      carrierIata,
      carrierName: carriers[carrierIata] ?? carrierIata,
      carrierColor: brandColor,
      flightNo: first.flightNo,
      cabin,
      stops: segments.length - 1,
      durationMin: isoDurationToMinutes(itin.duration) || segments.reduce((n, s) => n + s.durationMin, 0),
      departIso: first.departIso,
      arriveIso: last.arriveIso,
      seatsLeft: offer.numberOfBookableSeats ?? 9,
      fare,
      segments,
    });
  }
  return out;
}
