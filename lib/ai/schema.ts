import { z } from "zod";

export const CabinEnum = z.enum(["ECONOMY", "PREMIUM", "BUSINESS"]);
export const SortEnum = z.enum(["best", "price", "duration"]);
export const TripTypeEnum = z.enum(["one-way", "return", "multi-city"]);

const IATA = /^[A-Za-z]{3}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const LegSchema = z.object({
  origin: z.string().regex(IATA),
  dest: z.string().regex(IATA),
  date: z.string().regex(ISO_DATE),
});
export type Leg = z.infer<typeof LegSchema>;

/** Decodes a `LOS,DXB,2026-06-12|DXB,LHR,2026-06-20` URL string into an array. */
function preprocessLegs(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (!value) return undefined;
  return value
    .split("|")
    .map((seg) => seg.split(","))
    .filter((parts) => parts.length === 3)
    .map(([origin, dest, date]) => ({ origin, dest, date }));
}

export const FlightFilter = z.object({
  tripType: TripTypeEnum.default("one-way"),
  origin: z.string().regex(IATA).optional(),
  destination: z.string().regex(IATA).optional(),
  departDate: z.string().regex(ISO_DATE).optional(),
  returnDate: z.string().regex(ISO_DATE).optional(),
  legs: z.preprocess(preprocessLegs, z.array(LegSchema).max(6).optional()),
  passengers: z.coerce.number().int().min(1).max(9).default(1),
  // Breakdown of the passenger mix; `passengers` is the total (adults + children + infants).
  children: z.coerce.number().int().min(0).max(8).optional(),
  infants: z.coerce.number().int().min(0).max(8).optional(),
  cabin: CabinEnum.default("ECONOMY"),
  maxStops: z.coerce.number().int().min(0).max(2).optional(),
  maxBudget: z.coerce.number().int().min(0).optional(),
  departAfter: z.coerce.number().int().min(0).max(23).optional(),
  departBefore: z.coerce.number().int().min(1).max(24).optional(),
  arriveBefore: z.coerce.number().int().min(1).max(24).optional(),
  airlines: z.preprocess(
    (v) => (typeof v === "string" ? v.split(",").filter(Boolean) : v),
    z.array(z.string().regex(IATA)).optional(),
  ),
  sort: SortEnum.default("best"),
});

export type FlightFilter = z.infer<typeof FlightFilter>;

/** Serialise a list of legs into the compact URL form. */
export function encodeLegs(legs: Leg[]): string {
  return legs.map((l) => `${l.origin},${l.dest},${l.date}`).join("|");
}

/** Normalise a filter into a flat array of legs based on tripType. */
export function legsFromFilter(filter: FlightFilter): Leg[] {
  if (filter.tripType === "multi-city" && filter.legs && filter.legs.length > 0) {
    return filter.legs;
  }
  const o = filter.origin;
  const d = filter.destination;
  const dep = filter.departDate;
  if (!o || !d || !dep) return [];
  const out: Leg[] = [{ origin: o.toUpperCase(), dest: d.toUpperCase(), date: dep }];
  if (filter.tripType === "return" && filter.returnDate) {
    out.push({ origin: d.toUpperCase(), dest: o.toUpperCase(), date: filter.returnDate });
  }
  return out;
}
