import { z } from "zod";

export const CabinEnum = z.enum(["ECONOMY", "PREMIUM", "BUSINESS"]);
export const SortEnum = z.enum(["best", "price", "duration"]);

export const FlightFilter = z.object({
  origin: z.string().regex(/^[A-Za-z]{3}$/).optional(),
  destination: z.string().regex(/^[A-Za-z]{3}$/).optional(),
  departDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  passengers: z.coerce.number().int().min(1).max(9).default(1),
  cabin: CabinEnum.default("ECONOMY"),
  maxStops: z.coerce.number().int().min(0).max(2).optional(),
  maxBudget: z.coerce.number().int().min(0).optional(), // cents
  departAfter: z.coerce.number().int().min(0).max(23).optional(), // hour
  departBefore: z.coerce.number().int().min(1).max(24).optional(), // hour
  arriveBefore: z.coerce.number().int().min(1).max(24).optional(), // hour
  sort: SortEnum.default("best"),
});

export type FlightFilter = z.infer<typeof FlightFilter>;
