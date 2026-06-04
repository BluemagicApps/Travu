import type { Car } from "./types";

/** Protection plan options offered at checkout (flat per-day insurance rate). */
export const PROTECTION_PLANS = {
  NONE: { id: "NONE", label: "No protection", amountPerDay: 0 },
  TRAVU_PROTECT: { id: "TRAVU_PROTECT", label: "Full protection", amountPerDay: 1999 },
} as const;

export type ProtectionPlanId = keyof typeof PROTECTION_PLANS;

const TAX_RATE = 0.1; // simulated location tax
const SERVICE_FEE_RATE = 0.03; // simulated booking fee
const YOUNG_DRIVER_FEE_PER_DAY = 2500; // cents/day surcharge for drivers under 25

export interface CarPriceBreakdown {
  rentalDays: number;
  baseRate: number; // pricePerDay * rentalDays
  taxes: number;
  fees: number;
  protection: number;
  youngDriverFee: number;
  total: number; // everything, cents
  payToday: number; // = total (simulated)
}

export function protectionAmount(plan: ProtectionPlanId, days: number): number {
  return PROTECTION_PLANS[plan].amountPerDay * days;
}

/** Single source of truth for checkout pricing — used by the summary AND the API. */
export function computeCarPrice(
  car: Car,
  plan: ProtectionPlanId = "NONE",
  driverAge?: number,
): CarPriceBreakdown {
  const days = car.rentalDays;
  const baseRate = car.pricePerDay * days;
  const taxes = Math.round(baseRate * TAX_RATE);
  const fees = Math.round(baseRate * SERVICE_FEE_RATE);
  const protection = protectionAmount(plan, days);
  const youngDriverFee = driverAge != null && driverAge < 25 ? YOUNG_DRIVER_FEE_PER_DAY * days : 0;
  const total = baseRate + taxes + fees + protection + youngDriverFee;
  return { rentalDays: days, baseRate, taxes, fees, protection, youngDriverFee, total, payToday: total };
}
