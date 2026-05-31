import type { BoardType, Stay, StayParams } from "../types";
import { nightsBetween } from "../schema";
import { encodeStayId } from "../offer-id";

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOTEL_PREFIXES = ["Grand", "Park", "Royal", "Hotel", "The", "Casa", "Plaza", "Riverside"];
const HOTEL_SUFFIXES = ["Palace", "Suites", "Boutique", "Inn", "Residence", "Towers", "Garden", "Central"];
const AREAS = ["Old Town", "City Centre", "Waterfront", "Marina", "Arts District", "Historic Quarter"];
const AMENITY_POOL = ["wifi", "pool", "parking", "gym", "spa", "breakfast", "bar", "ac", "pet_friendly"];
const BOARDS: BoardType[] = ["ROOM_ONLY", "BREAKFAST", "HALF_BOARD", "ALL_INCLUSIVE"];
const ROOMS = ["Standard Double", "Deluxe King", "Junior Suite", "Twin Room", "Executive Suite"];
const COUNT = 24;

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function generateStays(params: StayParams): Stay[] {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  const rng = mulberry32(hashStr(`${params.destination}|${params.checkIn}|${params.checkOut}`));
  const out: Stay[] = [];
  for (let i = 0; i < COUNT; i++) {
    const stars = 2 + Math.floor(rng() * 4); // 2..5
    const base = 6000 + Math.floor(rng() * 22000) + stars * 3000; // cents/night
    const amenityCount = 3 + Math.floor(rng() * 5);
    const amenities = [...AMENITY_POOL].sort(() => rng() - 0.5).slice(0, amenityCount);
    const board = pick(rng, BOARDS);
    const refundable = rng() > 0.35;
    out.push({
      id: encodeStayId({
        destination: params.destination,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        index: i,
      }),
      name: `${pick(rng, HOTEL_PREFIXES)} ${params.destination} ${pick(rng, HOTEL_SUFFIXES)}`,
      city: params.destination,
      area: pick(rng, AREAS),
      lat: 0,
      lng: 0,
      starRating: stars,
      guestRating: Math.round((6.5 + rng() * 3.4) * 10) / 10, // 6.5..9.9
      reviewCount: 80 + Math.floor(rng() * 2400),
      images: [`https://picsum.photos/seed/${encodeURIComponent(params.destination)}-${i}/640/420`],
      amenities,
      roomName: pick(rng, ROOMS),
      boardType: board,
      refundable,
      cancellationPolicy: refundable ? "Free cancellation up to 48h before check-in" : "Non-refundable",
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      nights,
      pricePerNight: base,
      totalPrice: base * nights * params.rooms,
      currency: "USD",
    });
  }
  return out;
}
