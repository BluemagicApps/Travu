import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { resolveStay } from "@/lib/stays/resolve";
import { computeStayPrice, type ProtectionPlanId } from "@/lib/stays/pricing";
import type { Stay } from "@/lib/stays/types";
import { makeRef } from "@/lib/utils/ref";
import { awardForBooking } from "@/lib/onetoken/membership";

export const runtime = "nodejs";

const Guest = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  type: z.enum(["ADULT", "CHILD"]).default("ADULT"),
});
const Body = z.object({
  stayId: z.string().min(1),
  guests: z.array(Guest).min(1).max(16),
  rooms: z.coerce.number().int().min(1).max(8).default(1),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactCountry: z.string().optional(),
  billing: z
    .object({
      name: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  protectionPlan: z.enum(["NONE", "TRAVU_PROTECT"]).default("NONE"),
  cancellationTier: z.string().optional(),
  cardLast4: z.string().regex(/^\d{4}$/),
  cardBrand: z.string().trim().optional(),
  expMonth: z.coerce.number().int().min(1).max(12).optional(),
  expYear: z.coerce.number().int().min(2024).max(2099).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const d = parsed.data;

  // Resolve the stay (cached offer → LiteAPI detail → mock regen, all handled).
  const stay: Stay | null = await resolveStay(d.stayId);
  if (!stay) return NextResponse.json({ error: "stay_unavailable" }, { status: 404 });

  // Server-side price (single source of truth shared with the summary).
  const price = computeStayPrice(stay, d.rooms, d.protectionPlan as ProtectionPlanId);
  const bookingRef = makeRef();

  await prisma.stayBooking.create({
    data: {
      bookingRef,
      userId: session.user.id,
      currency: stay.currency,
      totalAmount: price.total,
      checkIn: new Date(`${stay.checkIn}T00:00:00Z`),
      checkOut: new Date(`${stay.checkOut}T00:00:00Z`),
      nights: stay.nights,
      rooms: d.rooms,
      contactEmail: d.contactEmail,
      contactPhone: d.contactPhone,
      contactCountry: d.contactCountry,
      billingName: d.billing?.name,
      billingAddress: d.billing?.address,
      billingCity: d.billing?.city,
      billingState: d.billing?.state,
      billingZip: d.billing?.zip,
      billingCountry: d.billing?.country,
      protectionPlan: d.protectionPlan,
      protectionAmount: price.protection,
      cancellationTier: d.cancellationTier,
      staySnapshot: stay as unknown as Prisma.InputJsonValue,
      guests: {
        create: d.guests.map((g) => ({
          firstName: g.firstName,
          lastName: g.lastName,
          type: g.type,
          email: d.contactEmail,
          phone: d.contactPhone,
        })),
      },
      payment: {
        create: {
          amount: price.total,
          currency: stay.currency,
          method: d.cardBrand ? d.cardBrand.toUpperCase() : "CARD",
          status: "PAID",
          last4: d.cardLast4,
          cardBrand: d.cardBrand,
          expMonth: d.expMonth,
          expYear: d.expYear,
        },
      },
    },
  });

  // Earn OneTokenCash on the stay — seamlessly enrols the user if needed and
  // auto-promotes their tier when they cross a threshold.
  const award = await awardForBooking({
    userId: session.user.id,
    amountCents: price.total,
    bookingRef,
    kind: "stay",
  });

  return NextResponse.json(
    { bookingRef, earned: award.earned, promotedTier: award.promoted ? award.tier : null },
    { status: 201 },
  );
}
