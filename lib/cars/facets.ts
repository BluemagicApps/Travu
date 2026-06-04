import type { Car } from "./types";

export interface FacetOption {
  key: string;
  count: number;
}

export type CarSort = "recommended" | "price" | "rating";

export interface CarFilterState {
  name: string; // free-text over vendor + model
  priceMin: number | null; // cents (total)
  priceMax: number | null; // cents (total)
  popular: Set<string>;
  carClasses: Set<string>; // CarClass values
  vendors: Set<string>;
  transmissions: Set<string>; // "automatic" | "manual"
  mileage: Set<string>; // "Unlimited" | "Limited"
  seats: Set<string>; // "4" | "5" | "7+"
  vendorRating: 0 | 7 | 8 | 9; // floor
  refundableOnly: boolean;
  memberDeals: boolean;
  sort: CarSort;
}

export interface CarFacets {
  minPrice: number;
  maxPrice: number;
  priceHistogram: number[]; // ~20 buckets across [minPrice, maxPrice]
  popular: FacetOption[];
  carClasses: FacetOption[];
  vendors: FacetOption[];
  transmissions: FacetOption[];
  mileage: FacetOption[];
  seats: FacetOption[];
  vendorRating: FacetOption[]; // keys "9","8","7"
}

const HISTOGRAM_BUCKETS = 20;

export function defaultCarFilterState(): CarFilterState {
  return {
    name: "",
    priceMin: null,
    priceMax: null,
    popular: new Set(),
    carClasses: new Set(),
    vendors: new Set(),
    transmissions: new Set(),
    mileage: new Set(),
    seats: new Set(),
    vendorRating: 0,
    refundableOnly: false,
    memberDeals: false,
    sort: "recommended",
  };
}

function seatKey(c: Car): string {
  if (c.seats >= 7) return "7+";
  return String(c.seats);
}
function tally(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}
function toOptions(map: Map<string, number>): FacetOption[] {
  return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

/** All facet counts are computed over the FULL fetched set (Expedia behaviour). */
export function computeCarFacets(cars: Car[]): CarFacets {
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = 0;
  const popular = new Map<string, number>();
  const carClasses = new Map<string, number>();
  const vendors = new Map<string, number>();
  const transmissions = new Map<string, number>();
  const mileage = new Map<string, number>();
  const seats = new Map<string, number>();
  const vendorRating = new Map<string, number>();

  for (const c of cars) {
    minPrice = Math.min(minPrice, c.totalPrice);
    maxPrice = Math.max(maxPrice, c.totalPrice);
    for (const p of c.popularTags ?? []) tally(popular, p);
    tally(carClasses, c.carClass);
    tally(vendors, c.vendor);
    tally(transmissions, c.transmission);
    tally(mileage, c.mileage);
    tally(seats, seatKey(c));
    if (c.vendorRating >= 9) tally(vendorRating, "9");
    if (c.vendorRating >= 8) tally(vendorRating, "8");
    if (c.vendorRating >= 7) tally(vendorRating, "7");
  }

  minPrice = Number.isFinite(minPrice) ? minPrice : 0;
  const span = Math.max(1, maxPrice - minPrice);
  const histogram = new Array(HISTOGRAM_BUCKETS).fill(0);
  for (const c of cars) {
    const b = Math.min(HISTOGRAM_BUCKETS - 1, Math.floor(((c.totalPrice - minPrice) / span) * HISTOGRAM_BUCKETS));
    histogram[b]++;
  }

  return {
    minPrice,
    maxPrice,
    priceHistogram: histogram,
    popular: toOptions(popular),
    carClasses: toOptions(carClasses),
    vendors: toOptions(vendors),
    transmissions: toOptions(transmissions),
    mileage: toOptions(mileage),
    seats: toOptions(seats),
    vendorRating: [
      { key: "9", count: vendorRating.get("9") ?? 0 },
      { key: "8", count: vendorRating.get("8") ?? 0 },
      { key: "7", count: vendorRating.get("7") ?? 0 },
    ],
  };
}

function bestScore(c: Car): number {
  return c.totalPrice - c.vendorRating * 2000;
}

/** AND across groups; OR within a multi-select group. */
function matches(c: Car, st: CarFilterState): boolean {
  if (st.name) {
    const hay = `${c.vendor} ${c.exampleModel}`.toLowerCase();
    if (!hay.includes(st.name.toLowerCase())) return false;
  }
  if (st.priceMin != null && c.totalPrice < st.priceMin) return false;
  if (st.priceMax != null && c.totalPrice > st.priceMax) return false;
  if (st.carClasses.size > 0 && !st.carClasses.has(c.carClass)) return false;
  if (st.vendors.size > 0 && !st.vendors.has(c.vendor)) return false;
  if (st.transmissions.size > 0 && !st.transmissions.has(c.transmission)) return false;
  if (st.mileage.size > 0 && !st.mileage.has(c.mileage)) return false;
  if (st.seats.size > 0 && !st.seats.has(seatKey(c))) return false;
  if (st.vendorRating > 0 && c.vendorRating < st.vendorRating) return false;
  if (st.popular.size > 0 && ![...st.popular].some((p) => (c.popularTags ?? []).includes(p))) return false;
  if (st.refundableOnly && !c.refundable) return false;
  if (st.memberDeals && !(c.originalPrice != null && c.originalPrice > c.totalPrice)) return false;
  return true;
}

export function filterAndSortCars(cars: Car[], st: CarFilterState): Car[] {
  const out = cars.filter((c) => matches(c, st));
  if (st.sort === "price") out.sort((a, b) => a.totalPrice - b.totalPrice);
  else if (st.sort === "rating") out.sort((a, b) => b.vendorRating - a.vendorRating);
  else out.sort((a, b) => bestScore(a) - bestScore(b));
  return out;
}
