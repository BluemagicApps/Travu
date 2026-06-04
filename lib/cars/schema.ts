import { z } from "zod";
import type { CarParams } from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const CarFilter = z
  .object({
    pickup: z.string().trim().min(1),
    dropoff: z.string().trim().min(1).optional(), // defaults to pickup
    pickupDate: z.string().regex(ISO_DATE),
    returnDate: z.string().regex(ISO_DATE),
    pickupTime: z.string().regex(HHMM).optional(),
    dropoffTime: z.string().regex(HHMM).optional(),
    driverAge: z.coerce.number().int().min(18).max(99).optional(),
    // client-side facet seeds (optional, from AI/quick links)
    maxPrice: z.coerce.number().int().min(0).optional(), // cents
  })
  .refine((f) => f.returnDate >= f.pickupDate, {
    message: "return_after_pickup",
    path: ["returnDate"],
  });

export type CarFilter = z.infer<typeof CarFilter>;

/** Whole rental days between two YYYY-MM-DD dates (UTC, min 1, no DST drift). */
export function rentalDays(pickupDate: string, returnDate: string): number {
  const a = Date.parse(`${pickupDate}T00:00:00Z`);
  const b = Date.parse(`${returnDate}T00:00:00Z`);
  return Math.max(1, Math.round((b - a) / 86400000));
}

/** CarParams for the provider, derived from a parsed filter. */
export function paramsFromFilter(f: CarFilter): CarParams {
  return {
    pickup: f.pickup,
    dropoff: f.dropoff?.trim() || f.pickup,
    pickupDate: f.pickupDate,
    returnDate: f.returnDate,
    pickupTime: f.pickupTime,
    dropoffTime: f.dropoffTime,
    driverAge: f.driverAge,
  };
}
