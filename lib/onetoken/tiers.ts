/**
 * Pure OneToken tier model — no database imports, so it is safe to use from
 * client components (e.g. the reward celebration) as well as server code.
 * lib/onetoken/membership.ts re-exports these alongside its Prisma-backed
 * functions, so existing server imports continue to work unchanged.
 */
export type Tier = "BLUE" | "SILVER" | "GOLD" | "PLATINUM";

export interface TierConfig {
  key: Tier;
  name: string;
  minTripElements: number;
  /** OneTokenCash earn rate on eligible spend (e.g. 0.02 = 2%). */
  earnRate: number;
  /** Member-price savings headline (%). */
  savingsPct: number;
  color: string;
  perks: string[];
}

// Mirrors Expedia One Key's tier ladder (img7): Blue 0–4, Silver 5–14,
// Gold 15–29, Platinum 30+ trip elements.
export const TIERS: TierConfig[] = [
  {
    key: "BLUE",
    name: "Blue",
    minTripElements: 0,
    earnRate: 0.02,
    savingsPct: 10,
    color: "#2563eb",
    perks: ["Access to free price tracking for flights", "Earn 2% in OneTokenCash on eligible bookings"],
  },
  {
    key: "SILVER",
    name: "Silver",
    minTripElements: 5,
    earnRate: 0.02,
    savingsPct: 15,
    color: "#94a3b8",
    perks: [
      "Member prices on over 10,000 hotels worldwide",
      "A perk when you stay at select VIP Access properties",
      "Priority traveler support",
    ],
  },
  {
    key: "GOLD",
    name: "Gold",
    minTripElements: 15,
    earnRate: 0.03,
    savingsPct: 20,
    color: "#d4a017",
    perks: [
      "Earn 3% in OneTokenCash on eligible bookings",
      "Room upgrades when available at VIP Access properties",
      "Price Drop Protection on select flight bookings",
    ],
  },
  {
    key: "PLATINUM",
    name: "Platinum",
    minTripElements: 30,
    earnRate: 0.04,
    savingsPct: 20,
    color: "#475569",
    perks: [
      "Earn 4% in OneTokenCash on eligible bookings",
      "Free breakfast at select VIP Access properties",
      "Dedicated Platinum VIP support",
    ],
  },
];

export function tierForElements(tripElements: number): TierConfig {
  let current = TIERS[0];
  for (const t of TIERS) if (tripElements >= t.minTripElements) current = t;
  return current;
}

export function tierConfig(tier: string): TierConfig {
  return TIERS.find((t) => t.key === tier) ?? TIERS[0];
}

/** Next tier and how many more trip elements are needed (null at Platinum). */
export function nextTier(tripElements: number): { tier: TierConfig; remaining: number } | null {
  const current = tierForElements(tripElements);
  const idx = TIERS.findIndex((t) => t.key === current.key);
  const next = TIERS[idx + 1];
  if (!next) return null;
  return { tier: next, remaining: next.minTripElements - tripElements };
}
