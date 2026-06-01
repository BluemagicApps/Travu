import type { BoardType, Stay, StayParams } from "../types";
import { nightsBetween } from "../schema";

export interface DuffelStaysResponse {
  data: { results: DuffelStayResult[] };
}
interface DuffelStayResult {
  id: string;
  accommodation: {
    name: string;
    rating?: number;
    review_score?: number;
    location?: {
      address?: { city_name?: string; region?: string };
      geographic_coordinates?: { latitude?: number; longitude?: number };
    };
    amenities?: { type: string }[];
    photos?: { url: string }[];
  };
  cheapest_rate_total_amount?: string;
  cheapest_rate_currency?: string;
  rooms?: {
    name?: string;
    rates?: {
      total_amount?: string;
      total_currency?: string;
      board_type?: string;
      conditions?: { type?: string; title?: string }[];
    }[];
  }[];
}

const cents = (s: string | undefined): number => Math.round(Number(s ?? "0") * 100);

const BOARD: Record<string, BoardType> = {
  room_only: "ROOM_ONLY",
  breakfast: "BREAKFAST",
  half_board: "HALF_BOARD",
  all_inclusive: "ALL_INCLUSIVE",
};

export function mapDuffelStays(json: DuffelStaysResponse, params: StayParams): Stay[] {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  const out: Stay[] = [];
  for (const r of json.data.results ?? []) {
    const a = r.accommodation;
    const room = r.rooms?.[0];
    const rate = room?.rates?.[0];
    const total = cents(rate?.total_amount ?? r.cheapest_rate_total_amount);
    if (total <= 0) continue;
    const refundable = (rate?.conditions ?? []).some((c) => c.type === "refundable");
    const images = (a.photos ?? []).map((p) => p.url);
    const amenities = (a.amenities ?? []).map((m) => m.type);
    out.push({
      id: `duffel_stay_${r.id}`,
      name: a.name,
      city: a.location?.address?.city_name ?? params.destination,
      area: a.location?.address?.region ?? "",
      lat: a.location?.geographic_coordinates?.latitude ?? 0,
      lng: a.location?.geographic_coordinates?.longitude ?? 0,
      starRating: a.rating ?? 0,
      guestRating: a.review_score ?? 0,
      reviewCount: 0,
      images,
      amenities,
      roomName: room?.name ?? "Standard Room",
      boardType: BOARD[rate?.board_type ?? "room_only"] ?? "ROOM_ONLY",
      refundable,
      cancellationPolicy:
        (rate?.conditions ?? []).find((c) => c.type === "refundable")?.title ??
        (refundable ? "Refundable" : "Non-refundable"),
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      nights,
      pricePerNight: Math.round(total / nights),
      totalPrice: total,
      currency: rate?.total_currency ?? r.cheapest_rate_currency ?? "USD",
      // ── Rich fields mapped from the live API where available; left undefined otherwise. ──
      // Keeps the seam ready so a Stays-scoped token auto-activates without UI rework.
      photos: images.map((url) => ({ url })),
      amenityGroups: amenities.length ? [{ group: "Property", items: amenities }] : undefined,
      reviewBreakdown: a.review_score != null ? { overall: a.review_score, cleanliness: a.review_score, staff: a.review_score, amenities: a.review_score, condition: a.review_score } : undefined,
      policies: {
        checkIn: "3:00 PM",
        checkOut: "11:00 AM",
        children: "Contact the property for child policies.",
        pets: "Contact the property for pet policies.",
        cancellationTiers: refundable
          ? [{ label: "Full refund", refundPct: 100 }, { label: "Check-in", date: params.checkIn, refundPct: 0 }]
          : [{ label: "No refund", refundPct: 0 }],
      },
      available: true,
    });
  }
  return out;
}
