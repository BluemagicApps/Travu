import type { BoardType, Stay, StayParams, StayPhoto } from "../types";
import { nightsBetween } from "../schema";
import { encodeLiteId } from "./ids";

// ── LiteAPI response shapes (the fields we use; confirmed against the sandbox) ──

export interface LiteHotel {
  id: string;
  name: string;
  main_photo?: string;
  thumbnail?: string;
  stars?: number; // hotel class 1–5
  rating?: number; // review score 0–10
  reviewCount?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
}

interface LiteMoney {
  amount: number;
  currency: string;
}
interface LiteRate {
  name?: string;
  boardType?: string;
  boardName?: string;
  retailRate?: { total?: LiteMoney[]; suggestedSellingPrice?: LiteMoney[] };
  cancellationPolicies?: { refundableTag?: string };
}
interface LiteRoomType {
  rates?: LiteRate[];
  offerRetailRate?: LiteMoney;
  suggestedSellingPrice?: LiteMoney;
}
export interface LiteRateHotel {
  hotelId: string;
  roomTypes?: LiteRoomType[];
}

export interface LiteHotelDetail {
  id?: string;
  name?: string;
  hotelDescription?: string;
  hotelImages?: { url?: string; urlHd?: string; caption?: string }[];
  facilities?: (string | { name?: string })[];
  rating?: number;
  reviewCount?: number;
  checkinCheckoutTimes?: { checkin?: string; checkout?: string };
}

const cents = (n: number | undefined): number => Math.round((n ?? 0) * 100);

const BOARD: Record<string, BoardType> = {
  RO: "ROOM_ONLY",
  BB: "BREAKFAST",
  HB: "HALF_BOARD",
  FB: "HALF_BOARD",
  AI: "ALL_INCLUSIVE",
};

/** Cheapest offer (total cents, SSP cents, room name, board, refundable) for a hotel. */
function cheapestOffer(rh: LiteRateHotel): {
  total: number;
  ssp: number;
  roomName: string;
  board: BoardType;
  refundable: boolean;
} | null {
  let best: { total: number; ssp: number; roomName: string; board: BoardType; refundable: boolean } | null = null;
  for (const rt of rh.roomTypes ?? []) {
    const rate = rt.rates?.[0];
    const total =
      cents(rt.offerRetailRate?.amount) ||
      cents(rate?.retailRate?.total?.[0]?.amount);
    if (total <= 0) continue;
    const ssp =
      cents(rt.suggestedSellingPrice?.amount) ||
      cents(rate?.retailRate?.suggestedSellingPrice?.[0]?.amount) ||
      total;
    const candidate = {
      total,
      ssp,
      roomName: rate?.name ?? "Standard Room",
      board: BOARD[rate?.boardType ?? "RO"] ?? "ROOM_ONLY",
      refundable: rate?.cancellationPolicies?.refundableTag === "RFN",
    };
    if (!best || candidate.total < best.total) best = candidate;
  }
  return best;
}

/** Build a search-result Stay from a hotel + its rate. Returns null with no rate. */
export function buildStay(
  hotel: LiteHotel,
  rateHotel: LiteRateHotel | undefined,
  params: StayParams,
): Stay | null {
  if (!rateHotel) return null;
  const offer = cheapestOffer(rateHotel);
  if (!offer) return null;

  const nights = nightsBetween(params.checkIn, params.checkOut);
  const totalPrice = offer.total * Math.max(1, params.rooms);
  const originalPrice = offer.ssp > offer.total ? offer.ssp * Math.max(1, params.rooms) : undefined;
  const hero = hotel.main_photo || hotel.thumbnail;
  const images = hero ? [hero] : [];

  return {
    id: encodeLiteId({
      hotelId: hotel.id,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      rooms: params.rooms,
      adults: params.adults,
    }),
    name: hotel.name,
    city: hotel.city ?? params.destination,
    area: hotel.address ?? "",
    lat: hotel.latitude ?? 0,
    lng: hotel.longitude ?? 0,
    starRating: hotel.stars ?? 0,
    guestRating: hotel.rating ?? 0,
    reviewCount: hotel.reviewCount ?? 0,
    images,
    originalPrice,
    amenities: [],
    roomName: offer.roomName,
    boardType: offer.board,
    refundable: offer.refundable,
    cancellationPolicy: offer.refundable ? "Free cancellation available" : "Non-refundable",
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    nights,
    pricePerNight: Math.round(totalPrice / nights),
    totalPrice,
    currency: "USD",
    photos: images.map((url) => ({ url })),
    available: true,
  };
}

/**
 * Merge full hotel-detail content (real photo gallery with captions, description,
 * amenities) onto a search Stay — used on the detail page.
 */
export function enrichWithDetail(stay: Stay, detail: LiteHotelDetail): Stay {
  const photos: StayPhoto[] = (detail.hotelImages ?? [])
    .map((im) => ({ url: im.urlHd || im.url || "", caption: im.caption }))
    .filter((p) => p.url);
  const images = photos.map((p) => p.url);
  const amenities = (detail.facilities ?? [])
    .map((f) => (typeof f === "string" ? f : f.name ?? ""))
    .filter(Boolean);
  const description = (detail.hotelDescription ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    ...stay,
    images: images.length ? images : stay.images,
    photos: photos.length ? photos : stay.photos,
    description: description || stay.description,
    amenities: amenities.length ? amenities : stay.amenities,
    amenityGroups: amenities.length ? [{ group: "Property amenities", items: amenities.slice(0, 24) }] : stay.amenityGroups,
    guestRating: detail.rating ?? stay.guestRating,
    reviewCount: detail.reviewCount ?? stay.reviewCount,
    policies:
      stay.policies ?? {
        checkIn: detail.checkinCheckoutTimes?.checkin ?? "3:00 PM",
        checkOut: detail.checkinCheckoutTimes?.checkout ?? "11:00 AM",
        children: "Contact the property for child policies.",
        pets: "Contact the property for pet policies.",
        cancellationTiers: stay.refundable
          ? [{ label: "Full refund", refundPct: 100 }, { label: "Check-in", date: stay.checkIn, refundPct: 0 }]
          : [{ label: "No refund", refundPct: 0 }],
      },
  };
}
