import type { BoardType, Stay, StayParams } from "../types";
import { nightsBetween } from "../schema";
import { encodeStayId } from "../offer-id";
import { getCityData } from "../data/cities";
import { pickPhotos } from "../data/photos";
import { ratingWordFor } from "../rating";

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

// Fallback name parts for cities we don't curate.
const FALLBACK_PREFIXES = ["Grand", "Park", "Royal", "Plaza", "Riverside", "Central"];
const FALLBACK_SUFFIXES = ["Hotel", "Suites", "Boutique", "Residence", "Inn", "Palace"];
const FALLBACK_AREAS = ["Old Town", "City Centre", "Waterfront", "Marina", "Arts District", "Historic Quarter"];
const AMENITY_POOL = ["wifi", "pool", "parking", "gym", "spa", "breakfast", "bar", "ac", "pet_friendly"];
const BOARDS: BoardType[] = ["ROOM_ONLY", "BREAKFAST", "HALF_BOARD", "ALL_INCLUSIVE"];
const ROOMS = ["Standard Double", "Deluxe King", "Junior Suite", "Twin Room", "Executive Suite"];
const COUNT = 24;

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function buildDescription(name: string, area: string, city: string, stars: number, amenities: string[]): string {
  const hl = amenities.includes("spa")
    ? "a relaxing spa"
    : amenities.includes("pool")
      ? "an inviting pool"
      : amenities.includes("bar")
        ? "a stylish bar"
        : "comfortable rooms";
  return `Set in ${area}, ${name} is a ${stars}-star stay in the heart of ${city}, offering ${hl} and easy access to the city's main sights.`;
}

export function generateStays(params: StayParams): Stay[] {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  const rng = mulberry32(hashStr(`${params.destination}|${params.checkIn}|${params.checkOut}`));
  const curated = getCityData(params.destination);
  const cityName = curated?.city ?? params.destination;
  const tier = curated?.priceTier ?? 1;

  const out: Stay[] = [];
  for (let i = 0; i < COUNT; i++) {
    const stars = 2 + Math.floor(rng() * 4); // 2..5

    const name = curated
      ? `${cityName} ${pick(rng, curated.hotelNames)}`
      : `${pick(rng, FALLBACK_PREFIXES)} ${params.destination} ${pick(rng, FALLBACK_SUFFIXES)}`;
    const area = curated ? pick(rng, curated.neighbourhoods) : pick(rng, FALLBACK_AREAS);

    const baseRaw = 6000 + Math.floor(rng() * 22000) + stars * 3000; // cents/night
    const base = Math.round((baseRaw * tier) / 100) * 100;

    const amenityCount = 3 + Math.floor(rng() * 5);
    const amenities = [...AMENITY_POOL].sort(() => rng() - 0.5).slice(0, amenityCount);
    const board = pick(rng, BOARDS);
    const refundable = rng() > 0.35;
    const guestRating = Math.round((6.5 + rng() * 3.4) * 10) / 10; // 6.5..9.9
    const photoCount = 5 + Math.floor(rng() * 2); // 5 or 6
    const images = pickPhotos(rng, photoCount);

    const totalPrice = base * nights * params.rooms;
    // ~45% of stays carry a deal; savings 8%–30%, deterministic.
    const hasDeal = rng() < 0.45;
    const savings = 0.08 + rng() * 0.22;
    const originalPrice = hasDeal ? Math.round(totalPrice / (1 - savings) / 100) * 100 : undefined;

    out.push({
      id: encodeStayId({
        destination: params.destination,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        index: i,
      }),
      name,
      city: cityName,
      area,
      lat: 0,
      lng: 0,
      starRating: stars,
      guestRating,
      ratingWord: ratingWordFor(guestRating),
      reviewCount: 80 + Math.floor(rng() * 2400),
      images,
      amenities,
      roomName: pick(rng, ROOMS),
      boardType: board,
      refundable,
      cancellationPolicy: refundable ? "Free cancellation up to 48h before check-in" : "Non-refundable",
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      nights,
      pricePerNight: base,
      totalPrice,
      originalPrice,
      currency: "USD",
      description: buildDescription(name, area, cityName, stars, amenities),
    });
  }
  return out;
}
