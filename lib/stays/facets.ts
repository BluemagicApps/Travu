import type { Stay } from "./types";

export interface AmenityFacet {
  key: string;
  count: number;
}
export interface StayFacets {
  minPrice: number;
  maxPrice: number;
  starCounts: Record<number, number>; // 1..5
  amenities: AmenityFacet[];
}
export interface StayFilterState {
  minStars: number; // 0 = any
  amenities: Set<string>;
  maxPrice: number | null; // cents
  sort: "best" | "price" | "rating";
}

export function computeStayFacets(stays: Stay[]): StayFacets {
  const starCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const amenities = new Map<string, number>();
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = 0;
  for (const s of stays) {
    if (starCounts[s.starRating] !== undefined) starCounts[s.starRating]++;
    for (const a of s.amenities) amenities.set(a, (amenities.get(a) ?? 0) + 1);
    minPrice = Math.min(minPrice, s.totalPrice);
    maxPrice = Math.max(maxPrice, s.totalPrice);
  }
  return {
    minPrice: Number.isFinite(minPrice) ? minPrice : 0,
    maxPrice,
    starCounts,
    amenities: [...amenities.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count),
  };
}

function bestScore(s: Stay): number {
  // cheaper + higher-rated ranks first
  return s.totalPrice - s.guestRating * 2000;
}

export function filterAndSortStays(stays: Stay[], state: StayFilterState): Stay[] {
  let out = stays;
  if (state.minStars > 0) out = out.filter((s) => s.starRating >= state.minStars);
  if (state.maxPrice != null) out = out.filter((s) => s.totalPrice <= state.maxPrice!);
  if (state.amenities.size > 0)
    out = out.filter((s) => [...state.amenities].every((a) => s.amenities.includes(a)));

  out = [...out];
  if (state.sort === "price") out.sort((a, b) => a.totalPrice - b.totalPrice);
  else if (state.sort === "rating") out.sort((a, b) => b.guestRating - a.guestRating);
  else out.sort((a, b) => bestScore(a) - bestScore(b));
  return out;
}
