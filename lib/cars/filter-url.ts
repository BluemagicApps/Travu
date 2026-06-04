import { defaultCarFilterState, type CarSort, type CarFilterState } from "./facets";

/**
 * Compact URL param <-> CarFilterState mapping so result filters are shareable
 * and survive reload/back. The search params (pickup/pickupDate/...) are owned by
 * CarFilter in schema.ts — these are the result-page facets only.
 */

const CSV_SETS: { key: keyof CarFilterState; param: string }[] = [
  { key: "popular", param: "pop" },
  { key: "carClasses", param: "class" },
  { key: "vendors", param: "vendor" },
  { key: "transmissions", param: "trans" },
  { key: "mileage", param: "mile" },
  { key: "seats", param: "seats" },
];

function csv(set: Set<string>): string {
  return [...set].join(",");
}
function parseCsv(v: string | null | undefined): Set<string> {
  return new Set((v ?? "").split(",").map((x) => x.trim()).filter(Boolean));
}

export function carFilterStateToQuery(st: CarFilterState): Record<string, string> {
  const q: Record<string, string> = {};
  if (st.name) q.name = st.name;
  if (st.priceMin != null) q.pmin = String(st.priceMin);
  if (st.priceMax != null) q.pmax = String(st.priceMax);
  for (const { key, param } of CSV_SETS) {
    const set = st[key] as Set<string>;
    if (set.size > 0) q[param] = csv(set);
  }
  if (st.vendorRating > 0) q.vr = String(st.vendorRating);
  if (st.refundableOnly) q.refund = "1";
  if (st.memberDeals) q.member = "1";
  if (st.sort !== "recommended") q.sort = st.sort;
  return q;
}

type SP = Record<string, string | string[] | undefined>;
function one(sp: SP, k: string): string | undefined {
  const v = sp[k];
  return Array.isArray(v) ? v[0] : v;
}

export function carFilterStateFromQuery(sp: SP): CarFilterState {
  const st = defaultCarFilterState();
  st.name = one(sp, "name") ?? "";
  const pmin = one(sp, "pmin");
  const pmax = one(sp, "pmax");
  st.priceMin = pmin != null && pmin !== "" ? Number(pmin) : null;
  st.priceMax = pmax != null && pmax !== "" ? Number(pmax) : null;
  for (const { key, param } of CSV_SETS) {
    (st[key] as Set<string>) = parseCsv(one(sp, param));
  }
  const vr = Number(one(sp, "vr") ?? 0);
  st.vendorRating = (vr === 9 || vr === 8 || vr === 7 ? vr : 0) as CarFilterState["vendorRating"];
  st.refundableOnly = one(sp, "refund") === "1";
  st.memberDeals = one(sp, "member") === "1";
  const sort = one(sp, "sort");
  st.sort = (["price", "rating"].includes(sort ?? "") ? sort : "recommended") as CarSort;
  return st;
}
