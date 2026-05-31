import { z } from "zod";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const StayFilter = z
  .object({
    destination: z.string().trim().min(1),
    checkIn: z.string().regex(ISO_DATE),
    checkOut: z.string().regex(ISO_DATE),
    adults: z.coerce.number().int().min(1).max(16).default(2),
    children: z.coerce.number().int().min(0).max(10).optional(),
    rooms: z.coerce.number().int().min(1).max(8).default(1),
    // client-side facet seeds (optional, from AI queries)
    maxPrice: z.coerce.number().int().min(0).optional(), // cents
    minStars: z.coerce.number().int().min(1).max(5).optional(),
  })
  .refine((f) => f.checkOut > f.checkIn, {
    message: "checkout_after_checkin",
    path: ["checkOut"],
  });

export type StayFilter = z.infer<typeof StayFilter>;

/** Whole nights between two YYYY-MM-DD dates (UTC, no DST drift). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = Date.parse(`${checkIn}T00:00:00Z`);
  const b = Date.parse(`${checkOut}T00:00:00Z`);
  return Math.max(1, Math.round((b - a) / 86400000));
}

/** StayParams for the provider, derived from a parsed filter. */
export function paramsFromFilter(f: StayFilter) {
  return {
    destination: f.destination,
    checkIn: f.checkIn,
    checkOut: f.checkOut,
    adults: f.adults,
    children: f.children,
    rooms: f.rooms,
  };
}
