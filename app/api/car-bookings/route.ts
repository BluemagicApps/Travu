import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { resolveCar } from "@/lib/cars/resolve";
import { computeCarPrice, type ProtectionPlanId } from "@/lib/cars/pricing";
import type { Car } from "@/lib/cars/types";
import { makeRef } from "@/lib/utils/ref";
import { awardForBooking } from "@/lib/onetoken/membership";

export const runtime = "nodejs";

const Driver = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  age: z.coerce.number().int().min(18).max(99).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  flightNo: z.string().trim().optional(),
  licenseNo: z.string().trim().optional(),
});

const Body = z.object({
  carId: z.string().min(1),
  driver: Driver,
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

  // Resolve the car (cached offer → mock regen, both handled).
  const car: Car | null = await resolveCar(d.carId);
  if (!car) return NextResponse.json({ error: "car_unavailable" }, { status: 404 });

  // Server-side price (single source of truth shared with the summary).
  const price = computeCarPrice(car, d.protectionPlan as ProtectionPlanId, d.driver.age);
  const bookingRef = makeRef();

  await prisma.carBooking.create({
    data: {
      bookingRef,
      userId: session.user.id,
      currency: car.currency,
      totalAmount: price.total,
      pickupLocation: car.pickupLocation,
      dropoffLocation: car.dropoffLocation,
      pickupDate: new Date(`${car.pickupDate}T00:00:00Z`),
      returnDate: new Date(`${car.returnDate}T00:00:00Z`),
      pickupTime: car.pickupTime,
      dropoffTime: car.dropoffTime,
      rentalDays: car.rentalDays,
      carClass: car.carClass,
      vendor: car.vendor,
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
      carSnapshot: car as unknown as Prisma.InputJsonValue,
      renter: {
        create: {
          firstName: d.driver.firstName,
          lastName: d.driver.lastName,
          age: d.driver.age,
          email: d.driver.email ?? d.contactEmail,
          phone: d.driver.phone ?? d.contactPhone,
          flightNo: d.driver.flightNo,
          licenseNo: d.driver.licenseNo,
        },
      },
      payment: {
        create: {
          amount: price.total,
          currency: car.currency,
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

  // Earn OneTokenCash on the rental (members only; no-op otherwise).
  const earned = await awardForBooking({
    userId: session.user.id,
    amountCents: price.total,
    bookingRef,
    kind: "car",
  });

  return NextResponse.json({ bookingRef, earned }, { status: 201 });
}
