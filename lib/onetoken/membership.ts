import { prisma } from "@/lib/db/prisma";
import { type Tier, tierConfig, tierForElements } from "./tiers";

// Re-export the pure tier model so existing server-side imports from this module
// keep working (client code should import from "./tiers" directly to avoid
// pulling Prisma into the client bundle).
export { TIERS, tierConfig, tierForElements, nextTier } from "./tiers";
export type { Tier, TierConfig } from "./tiers";

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

export interface AwardResult {
  /** Points earned on this booking (cents). */
  earned: number;
  /** True when this booking created the membership (seamless auto-enroll). */
  enrolled: boolean;
  tripElements: number;
  previousTier: Tier;
  /** Tier after this booking. */
  tier: Tier;
  /** True when the tier moved up because of this booking. */
  promoted: boolean;
}

/**
 * Award OneTokenCash + a trip element for a completed booking, recomputing the
 * tier. Seamless enrolment: if the user is not yet a member, this enrolls them
 * automatically so every booking counts — no separate "join" step required.
 * Auto-promotes when the new trip-element count crosses a tier threshold.
 */
export async function awardForBooking(args: {
  userId: string;
  amountCents: number;
  bookingRef: string;
  kind: "flight" | "stay" | "car";
}): Promise<AwardResult> {
  const { userId, amountCents, bookingRef, kind } = args;
  // Auto-enroll on first booking (upsert) so the program is frictionless.
  const existing = await prisma.membership.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  const enrolled = existing.tripElements === 0 && existing.lifetimePoints === 0;

  const previousTier = existing.tier as Tier;
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

  return {
    earned,
    enrolled,
    tripElements,
    previousTier,
    tier: newTier,
    promoted: newTier !== previousTier,
  };
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
