import type { Stay } from "./types";

/** Protection plan options offered at checkout. */
export const PROTECTION_PLANS = {
  NONE: { id: "NONE", label: "No protection", amountPct: 0 },
  TRAVU_PROTECT: { id: "TRAVU_PROTECT", label: "Travu Protect", amountPct: 0.06 },
} as const;

export type ProtectionPlanId = keyof typeof PROTECTION_PLANS;

const TAX_RATE = 0.12; // simulated occupancy tax
const SERVICE_FEE_RATE = 0.03; // simulated service fee

export interface StayPriceBreakdown {
  nights: number;
  rooms: number;
  roomSubtotal: number; // pricePerNight * nights * rooms
  taxes: number;
  fees: number;
  protection: number;
  total: number; // everything, cents
  payToday: number; // = total (simulated)
}

export function protectionAmount(plan: ProtectionPlanId, roomSubtotal: number): number {
  return Math.round(roomSubtotal * PROTECTION_PLANS[plan].amountPct);
}

/** Single source of truth for checkout pricing — used by the summary AND the API. */
export function computeStayPrice(stay: Stay, rooms: number, plan: ProtectionPlanId = "NONE"): StayPriceBreakdown {
  const roomSubtotal = stay.pricePerNight * stay.nights * rooms;
  const taxes = Math.round(roomSubtotal * TAX_RATE);
  const fees = Math.round(roomSubtotal * SERVICE_FEE_RATE);
  const protection = protectionAmount(plan, roomSubtotal);
  const total = roomSubtotal + taxes + fees + protection;
  return { nights: stay.nights, rooms, roomSubtotal, taxes, fees, protection, total, payToday: total };
}
