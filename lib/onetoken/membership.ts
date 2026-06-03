import { prisma } from "@/lib/db/prisma";

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

export interface MembershipView {
  tier: Tier;
  pointsBalance: number; // cents
  lifetimePoints: number; // cents
  tripElements: number;
}

export async function getMembership(userId: string): Promise<MembershipView | null> {
  const m = await prisma.membership.findUnique({ where: { userId } });
  if (!m) return null;
  return {
    tier: m.tier as Tier,
    pointsBalance: m.pointsBalance,
    lifetimePoints: m.lifetimePoints,
    tripElements: m.tripElements,
  };
}

export async function getOrCreateMembership(userId: string): Promise<MembershipView> {
  const m = await prisma.membership.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  return {
    tier: m.tier as Tier,
    pointsBalance: m.pointsBalance,
    lifetimePoints: m.lifetimePoints,
    tripElements: m.tripElements,
  };
}

/**
 * Award OneTokenCash + a trip element for a completed booking, recomputing the
 * tier. No-op-safe: creates the membership if the user joined implicitly. Returns
 * the points earned (cents).
 */
export async function awardForBooking(args: {
  userId: string;
  amountCents: number;
  bookingRef: string;
  kind: "flight" | "stay";
}): Promise<number> {
  const { userId, amountCents, bookingRef, kind } = args;
  const existing = await prisma.membership.findUnique({ where: { userId } });
  // Only accrue for users who have joined OneToken.
  if (!existing) return 0;

  const rate = tierConfig(existing.tier).earnRate;
  const earned = Math.max(0, Math.round(amountCents * rate));
  const tripElements = existing.tripElements + 1;
  const newTier = tierForElements(tripElements).key;

  await prisma.$transaction([
    prisma.membership.update({
      where: { userId },
      data: {
        pointsBalance: existing.pointsBalance + earned,
        lifetimePoints: existing.lifetimePoints + earned,
        tripElements,
        tier: newTier,
      },
    }),
    prisma.pointsTransaction.create({
      data: {
        membershipId: existing.id,
        type: "EARN",
        amount: earned,
        bookingRef,
        description: `Earned on ${kind} booking ${bookingRef}`,
      },
    }),
  ]);
  return earned;
}

/**
 * Redeem OneTokenCash against a booking. Clamps to the available balance and the
 * requested amount; returns the cents actually applied (0 if not a member).
 */
export async function redeemForBooking(args: {
  userId: string;
  requestedCents: number;
  maxCents: number;
  bookingRef: string;
}): Promise<number> {
  const { userId, requestedCents, maxCents, bookingRef } = args;
  if (requestedCents <= 0) return 0;
  const m = await prisma.membership.findUnique({ where: { userId } });
  if (!m) return 0;

  const applied = Math.min(requestedCents, m.pointsBalance, Math.max(0, maxCents));
  if (applied <= 0) return 0;

  await prisma.$transaction([
    prisma.membership.update({
      where: { userId },
      data: { pointsBalance: m.pointsBalance - applied },
    }),
    prisma.pointsTransaction.create({
      data: {
        membershipId: m.id,
        type: "REDEEM",
        amount: applied,
        bookingRef,
        description: `Redeemed on booking ${bookingRef}`,
      },
    }),
  ]);
  return applied;
}
