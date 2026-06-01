import { defaultFilterState, type PropertyKind, type StaySort, type StayFilterState } from "./facets";

/**
 * Compact URL param <-> StayFilterState mapping so result filters are shareable
 * and survive reload/back. The search params (destination/checkIn/...) are owned
 * by StayFilter in schema.ts — these are the result-page facets only.
 */

const CSV_SETS: { key: keyof StayFilterState; param: string }[] = [
  { key: "popular", param: "pop" },
  { key: "propertyAmenities", param: "amen" },
  { key: "roomAmenities", param: "ramen" },
  { key: "roomViews", param: "views" },
  { key: "brands", param: "brand" },
  { key: "paymentTypes", param: "pay" },
  { key: "cancellation", param: "cancel" },
  { key: "travelerExperience", param: "tx" },
  { key: "mealPlans", param: "meals" },
  { key: "bedrooms", param: "bed" },
];

function csv(set: Set<string>): string {
  return [...set].join(",");
}
function parseCsv(v: string | null | undefined): Set<string> {
  return new Set((v ?? "").split(",").map((x) => x.trim()).filter(Boolean));
}

export function filterStateToQuery(st: StayFilterState): Record<string, string> {
  const q: Record<string, string> = {};
  if (st.name) q.name = st.name;
  if (st.priceMin != null) q.pmin = String(st.priceMin);
  if (st.priceMax != null) q.pmax = String(st.priceMax);
  for (const { key, param } of CSV_SETS) {
    const set = st[key] as Set<string>;
    if (set.size > 0) q[param] = csv(set);
  }
  if (st.stars.size > 0) q.stars = [...st.stars].join(",");
  if (st.guestRating > 0) q.gr = String(st.guestRating);
  if (st.availableOnly) q.avail = "1";
  if (st.beachAccess) q.beach = "1";
  if (st.memberDeals) q.member = "1";
  if (st.propertyKind !== "all") q.kind = st.propertyKind;
  if (st.sort !== "recommended") q.sort = st.sort;
  return q;
}

type SP = Record<string, string | string[] | undefined>;
function one(sp: SP, k: string): string | undefined {
  const v = sp[k];
  return Array.isArray(v) ? v[0] : v;
}

export function filterStateFromQuery(sp: SP): StayFilterState {
  const st = defaultFilterState();
  st.name = one(sp, "name") ?? "";
  const pmin = one(sp, "pmin");
  const pmax = one(sp, "pmax");
  st.priceMin = pmin != null && pmin !== "" ? Number(pmin) : null;
  st.priceMax = pmax != null && pmax !== "" ? Number(pmax) : null;
  for (const { key, param } of CSV_SETS) {
    (st[key] as Set<string>) = parseCsv(one(sp, param));
  }
  st.stars = new Set([...parseCsv(one(sp, "stars"))].map(Number).filter((n) => n >= 1 && n <= 5));
  const gr = Number(one(sp, "gr") ?? 0);
  st.guestRating = (gr === 9 || gr === 8 || gr === 7 ? gr : 0) as StayFilterState["guestRating"];
  st.availableOnly = one(sp, "avail") === "1";
  st.beachAccess = one(sp, "beach") === "1";
  st.memberDeals = one(sp, "member") === "1";
  const kind = one(sp, "kind");
  st.propertyKind = (kind === "hotels" || kind === "homes" ? kind : "all") as PropertyKind;
  const sort = one(sp, "sort");
  st.sort = (["price", "rating", "distance"].includes(sort ?? "") ? sort : "recommended") as StaySort;
  return st;
}
