import type { Stay } from "./types";

export interface FacetOption {
  key: string;
  count: number;
}

export type PropertyKind = "all" | "hotels" | "homes";
export type StaySort = "recommended" | "price" | "rating" | "distance";

export interface StayFilterState {
  name: string;
  priceMin: number | null; // cents
  priceMax: number | null; // cents
  popular: Set<string>;
  propertyAmenities: Set<string>;
  roomAmenities: Set<string>;
  roomViews: Set<string>;
  brands: Set<string>;
  paymentTypes: Set<string>; // "pay_later"
  cancellation: Set<string>; // "fully_refundable"
  guestRating: 0 | 7 | 8 | 9; // floor
  stars: Set<number>; // 1..5
  travelerExperience: Set<string>; // business/family/budget/adults_only
  mealPlans: Set<string>;
  bedrooms: Set<string>; // "studio" | "1" | "2"
  availableOnly: boolean;
  beachAccess: boolean;
  memberDeals: boolean;
  propertyKind: PropertyKind;
  sort: StaySort;
}

export interface StayFacets {
  minPrice: number;
  maxPrice: number;
  priceHistogram: number[]; // ~20 buckets across [minPrice, maxPrice]
  stars: FacetOption[]; // key "5".."1"
  popular: FacetOption[];
  propertyAmenities: FacetOption[];
  roomAmenities: FacetOption[];
  roomViews: FacetOption[];
  brands: FacetOption[];
  paymentTypes: FacetOption[];
  cancellation: FacetOption[];
  guestRating: FacetOption[]; // keys "9","8","7"
  travelerExperience: FacetOption[];
  mealPlans: FacetOption[];
  bedrooms: FacetOption[];
  propertyKind: FacetOption[]; // keys "hotels","homes"
}

const PROPERTY_AMENITY_KEYS = ["pool", "parking", "gym", "spa", "bar", "breakfast", "pet_friendly"];
const ROOM_AMENITY_KEYS = ["wifi", "ac"];
const HISTOGRAM_BUCKETS = 20;

export function defaultFilterState(): StayFilterState {
  return {
    name: "",
    priceMin: null,
    priceMax: null,
    popular: new Set(),
    propertyAmenities: new Set(),
    roomAmenities: new Set(),
    roomViews: new Set(),
    brands: new Set(),
    paymentTypes: new Set(),
    cancellation: new Set(),
    guestRating: 0,
    stars: new Set(),
    travelerExperience: new Set(),
    mealPlans: new Set(),
    bedrooms: new Set(),
    availableOnly: false,
    beachAccess: false,
    memberDeals: false,
    propertyKind: "all",
    sort: "recommended",
  };
}

function isHome(s: Stay): boolean {
  return s.propertyType === "apartment" || s.propertyType === "home";
}
function isHotel(s: Stay): boolean {
  return s.propertyType === "hotel" || s.propertyType === "resort";
}
function bedroomKey(s: Stay): string {
  const b = s.bedrooms ?? 1;
  if (b >= 2) return "2";
  if (b === 1) return "1";
  return "studio";
}
function tally(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}
function toOptions(map: Map<string, number>): FacetOption[] {
  return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

/** All facet counts are computed over the FULL fetched set (Expedia behaviour). */
export function computeStayFacets(stays: Stay[]): StayFacets {
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = 0;
  const stars = new Map<string, number>();
  const popular = new Map<string, number>();
  const propertyAmenities = new Map<string, number>();
  const roomAmenities = new Map<string, number>();
  const roomViews = new Map<string, number>();
  const brands = new Map<string, number>();
  const paymentTypes = new Map<string, number>();
  const cancellation = new Map<string, number>();
  const guestRating = new Map<string, number>();
  const travelerExperience = new Map<string, number>();
  const mealPlans = new Map<string, number>();
  const bedrooms = new Map<string, number>();
  const propertyKind = new Map<string, number>();

  for (const s of stays) {
    minPrice = Math.min(minPrice, s.totalPrice);
    maxPrice = Math.max(maxPrice, s.totalPrice);
    tally(stars, String(s.starRating));
    for (const p of s.popularTags ?? []) tally(popular, p);
    for (const a of s.amenities) {
      if (PROPERTY_AMENITY_KEYS.includes(a)) tally(propertyAmenities, a);
      if (ROOM_AMENITY_KEYS.includes(a)) tally(roomAmenities, a);
    }
    for (const v of s.roomViews ?? []) tally(roomViews, v);
    if (s.brand) tally(brands, s.brand);
    if (s.payLater) tally(paymentTypes, "pay_later");
    if (s.refundable) tally(cancellation, "fully_refundable");
    if (s.guestRating >= 9) tally(guestRating, "9");
    if (s.guestRating >= 8) tally(guestRating, "8");
    if (s.guestRating >= 7) tally(guestRating, "7");
    for (const t of s.travelerTypes ?? []) tally(travelerExperience, t);
    for (const m of s.mealPlans ?? []) tally(mealPlans, m);
    tally(bedrooms, bedroomKey(s));
    if (isHotel(s)) tally(propertyKind, "hotels");
    if (isHome(s)) tally(propertyKind, "homes");
  }

  minPrice = Number.isFinite(minPrice) ? minPrice : 0;
  const span = Math.max(1, maxPrice - minPrice);
  const histogram = new Array(HISTOGRAM_BUCKETS).fill(0);
  for (const s of stays) {
    const b = Math.min(HISTOGRAM_BUCKETS - 1, Math.floor(((s.totalPrice - minPrice) / span) * HISTOGRAM_BUCKETS));
    histogram[b]++;
  }

  return {
    minPrice,
    maxPrice,
    priceHistogram: histogram,
    stars: toOptions(stars),
    popular: toOptions(popular),
    propertyAmenities: toOptions(propertyAmenities),
    roomAmenities: toOptions(roomAmenities),
    roomViews: toOptions(roomViews),
    brands: toOptions(brands),
    paymentTypes: toOptions(paymentTypes),
    cancellation: toOptions(cancellation),
    guestRating: [
      { key: "9", count: guestRating.get("9") ?? 0 },
      { key: "8", count: guestRating.get("8") ?? 0 },
      { key: "7", count: guestRating.get("7") ?? 0 },
    ],
    travelerExperience: toOptions(travelerExperience),
    mealPlans: toOptions(mealPlans),
    bedrooms: toOptions(bedrooms),
    propertyKind: toOptions(propertyKind),
  };
}

/** Haversine distance (km) for the "distance" sort, relative to the result centroid. */
function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function bestScore(s: Stay): number {
  return s.totalPrice - s.guestRating * 2000;
}

/** AND across groups; OR within a multi-select group. */
function matches(s: Stay, st: StayFilterState): boolean {
  if (st.name && !s.name.toLowerCase().includes(st.name.toLowerCase())) return false;
  if (st.priceMin != null && s.totalPrice < st.priceMin) return false;
  if (st.priceMax != null && s.totalPrice > st.priceMax) return false;
  if (st.stars.size > 0 && !st.stars.has(s.starRating)) return false;
  if (st.guestRating > 0 && s.guestRating < st.guestRating) return false;
  if (st.propertyKind === "hotels" && !isHotel(s)) return false;
  if (st.propertyKind === "homes" && !isHome(s)) return false;
  if (st.popular.size > 0 && ![...st.popular].some((p) => (s.popularTags ?? []).includes(p))) return false;
  if (st.propertyAmenities.size > 0 && ![...st.propertyAmenities].some((a) => s.amenities.includes(a))) return false;
  if (st.roomAmenities.size > 0 && ![...st.roomAmenities].some((a) => s.amenities.includes(a))) return false;
  if (st.roomViews.size > 0 && ![...st.roomViews].some((v) => (s.roomViews ?? []).includes(v))) return false;
  if (st.brands.size > 0 && !(s.brand && st.brands.has(s.brand))) return false;
  if (st.paymentTypes.has("pay_later") && !s.payLater) return false;
  if (st.cancellation.has("fully_refundable") && !s.refundable) return false;
  if (st.travelerExperience.size > 0 && ![...st.travelerExperience].some((t) => (s.travelerTypes ?? []).includes(t as never))) return false;
  if (st.mealPlans.size > 0 && ![...st.mealPlans].some((m) => (s.mealPlans ?? []).includes(m))) return false;
  if (st.bedrooms.size > 0 && !st.bedrooms.has(bedroomKey(s))) return false;
  if (st.availableOnly && s.available === false) return false;
  if (st.beachAccess && !s.beachAccess) return false;
  if (st.memberDeals && !(s.originalPrice != null && s.originalPrice > s.totalPrice)) return false;
  return true;
}

export function filterAndSortStays(stays: Stay[], st: StayFilterState): Stay[] {
  const out = stays.filter((s) => matches(s, st));
  if (st.sort === "price") out.sort((a, b) => a.totalPrice - b.totalPrice);
  else if (st.sort === "rating") out.sort((a, b) => b.guestRating - a.guestRating);
  else if (st.sort === "distance") {
    const withCoords = out.filter((s) => s.lat && s.lng);
    if (withCoords.length > 0) {
      const cLat = withCoords.reduce((s, x) => s + x.lat, 0) / withCoords.length;
      const cLng = withCoords.reduce((s, x) => s + x.lng, 0) / withCoords.length;
      out.sort((a, b) => haversine(cLat, cLng, a.lat, a.lng) - haversine(cLat, cLng, b.lat, b.lng));
    }
  } else out.sort((a, b) => bestScore(a) - bestScore(b));
  return out;
}
