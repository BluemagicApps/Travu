import { demandMultiplier } from "./pricing";

export interface Prediction {
  direction: "rise" | "fall" | "stable";
  pct: number;
  confidence: number;
  recommendation: string;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/**
 * Deterministic price-trend forecast over the next 7 days, derived from the
 * same demand curve the pricing model uses. Closer departures trend upward.
 */
export function predict(opts: { daysToDeparture: number }): Prediction {
  const days = Math.max(0, opts.daysToDeparture);
  const now = demandMultiplier(days);
  const future = demandMultiplier(Math.max(0, days - 7));
  const delta = (future - now) / now;
  const pct = Math.round(Math.abs(delta) * 100);

  let direction: Prediction["direction"];
  if (pct < 2) direction = "stable";
  else direction = delta > 0 ? "rise" : "fall";

  const urgency = clamp((21 - days) / 21, 0, 1);
  const confidence = Math.round(55 + urgency * 35);

  const recommendation =
    direction === "rise"
      ? `Prices likely to rise ~${pct}% in the next 7 days — book soon.`
      : direction === "fall"
        ? `Prices may dip ~${pct}% soon — you could wait.`
        : "Prices look steady for now.";

  return { direction, pct, confidence, recommendation };
}
