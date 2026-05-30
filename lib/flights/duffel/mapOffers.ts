import { isoDurationToMinutes } from "../duration";
import type { Cabin, Fare, Flight, Segment } from "../types";

interface DuffelSeg {
  origin: { iata_code: string };
  destination: { iata_code: string };
  departing_at: string;
  arriving_at: string;
  duration?: string;
  marketing_carrier: { iata_code: string; name: string };
  marketing_carrier_flight_number: string;
  operating_carrier?: { iata_code?: string; name?: string };
}
interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency?: string;
  base_amount?: string;
  tax_amount?: string;
  owner: { iata_code: string; name: string };
  slices: { duration?: string; segments: DuffelSeg[] }[];
}
export interface DuffelOffersResponse {
  data: { offers: DuffelOffer[] };
}

const cents = (v: string | undefined): number => Math.round(Number(v ?? 0) * 100);

export function mapDuffelOffers(resp: DuffelOffersResponse, cabin: Cabin, brandColor: string): Flight[] {
  const out: Flight[] = [];
  for (const offer of resp.data?.offers ?? []) {
    const slice = offer.slices?.[0];
    if (!slice || slice.segments.length === 0) continue;

    const segments: Segment[] = slice.segments.map((s) => ({
      airlineIata: s.marketing_carrier.iata_code,
      airlineName: s.marketing_carrier.name,
      flightNo: s.marketing_carrier_flight_number,
      originIata: s.origin.iata_code,
      destIata: s.destination.iata_code,
      departIso: s.departing_at,
      arriveIso: s.arriving_at,
      durationMin: isoDurationToMinutes(s.duration),
    }));

    const first = segments[0];
    const last = segments[segments.length - 1];
    const total = cents(offer.total_amount);
    const base = offer.base_amount ? cents(offer.base_amount) : total;
    const taxes = offer.tax_amount ? cents(offer.tax_amount) : Math.max(0, total - base);
    const fare: Fare = { base, taxes, fees: 0, total };

    out.push({
      id: `duffel_${offer.id}`,
      carrierIata: offer.owner.iata_code,
      carrierName: offer.owner.name,
      carrierColor: brandColor,
      flightNo: first.flightNo,
      cabin,
      stops: segments.length - 1,
      durationMin: isoDurationToMinutes(slice.duration) || segments.reduce((n, s) => n + s.durationMin, 0),
      departIso: first.departIso,
      arriveIso: last.arriveIso,
      seatsLeft: 9,
      fare,
      segments,
    });
  }
  return out;
}
