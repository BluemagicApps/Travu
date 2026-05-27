import type { Cabin, Fare } from "./types";

const CABIN_BASE: Record<Cabin, number> = { ECONOMY: 40, PREMIUM: 90, BUSINESS: 180 };
const CABIN_FACTOR: Record<Cabin, number> = { ECONOMY: 0.06, PREMIUM: 0.12, BUSINESS: 0.22 };

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/** Higher as departure approaches (proxy for demand). */
export function demandMultiplier(daysToDeparture: number): number {
  const urgency = clamp((21 - daysToDeparture) / 21, 0, 1);
  return 1 + urgency * 0.6;
}

export function priceFor(opts: {
  distanceKm: number;
  cabin: Cabin;
  daysToDeparture: number;
  rand: () => number;
}): Fare {
  const { distanceKm, cabin, daysToDeparture, rand } = opts;
  const raw =
    (CABIN_BASE[cabin] + distanceKm * CABIN_FACTOR[cabin]) * demandMultiplier(daysToDeparture);
  const variance = 0.9 + rand() * 0.2;
  const base = Math.round(raw * variance) * 100; // dollars -> cents
  const taxes = Math.round(base * 0.18);
  const fees = 2500; // flat $25
  return { base, taxes, fees, total: base + taxes + fees };
}
