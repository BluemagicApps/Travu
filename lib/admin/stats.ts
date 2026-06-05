import { prisma } from "@/lib/db/prisma";

export interface AdminOverview {
  users: number;
  admins: number;
  members: number;
  bookings: { flight: number; stay: number; car: number; total: number };
  revenueCents: number;
}

/** Headline counts + total revenue for the admin overview dashboard. */
export async function getOverview(): Promise<AdminOverview> {
  const [users, admins, members, flight, stay, car, fRev, sRev, cRev] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.membership.count(),
    prisma.booking.count(),
    prisma.stayBooking.count(),
    prisma.carBooking.count(),
    prisma.booking.aggregate({ _sum: { totalAmount: true } }),
    prisma.stayBooking.aggregate({ _sum: { totalAmount: true } }),
    prisma.carBooking.aggregate({ _sum: { totalAmount: true } }),
  ]);
  const revenueCents =
    (fRev._sum.totalAmount ?? 0) + (sRev._sum.totalAmount ?? 0) + (cRev._sum.totalAmount ?? 0);
  return {
    users,
    admins,
    members,
    bookings: { flight, stay, car, total: flight + stay + car },
    revenueCents,
  };
}
