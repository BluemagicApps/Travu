import { prisma } from "@/lib/db/prisma";
import { type PageParams, paginated, type Paginated } from "./pagination";

export type Vertical = "flight" | "stay" | "car";
export type VerticalFilter = Vertical | "all";

export interface AdminBookingRow {
  vertical: Vertical;
  ref: string;
  total: number;
  currency: string;
  status: string;
  email: string | null;
  createdAt: string; // ISO — sorts chronologically as a string
}

function whereFor(q: string) {
  if (!q) return {};
  return {
    OR: [
      { bookingRef: { contains: q, mode: "insensitive" as const } },
      { contactEmail: { contains: q, mode: "insensitive" as const } },
    ],
  };
}

const SELECT = {
  bookingRef: true,
  totalAmount: true,
  currency: true,
  status: true,
  contactEmail: true,
  createdAt: true,
} as const;

interface Raw {
  bookingRef: string;
  totalAmount: number;
  currency: string;
  status: string;
  contactEmail: string | null;
  createdAt: Date;
}

function toRow(vertical: Vertical, r: Raw): AdminBookingRow {
  return {
    vertical,
    ref: r.bookingRef,
    total: r.totalAmount,
    currency: r.currency,
    status: r.status,
    email: r.contactEmail,
    createdAt: r.createdAt.toISOString(),
  };
}

/**
 * Unified booking search across the three verticals. For a single vertical we
 * page directly (skip/take). For "all" we fetch the first (skip+take) rows from
 * each table, merge by recency, and slice — approximate deep paging that is fine
 * at admin scale (filter by vertical for exact deep pagination).
 */
export async function listBookings(opts: {
  q: string;
  vertical: VerticalFilter;
  p: PageParams;
}): Promise<Paginated<AdminBookingRow>> {
  const { q, vertical, p } = opts;
  const where = whereFor(q);

  if (vertical === "flight") {
    const [rows, total] = await Promise.all([
      prisma.booking.findMany({ where, orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take, select: SELECT }),
      prisma.booking.count({ where }),
    ]);
    return paginated(rows.map((r) => toRow("flight", r)), total, p);
  }
  if (vertical === "stay") {
    const [rows, total] = await Promise.all([
      prisma.stayBooking.findMany({ where, orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take, select: SELECT }),
      prisma.stayBooking.count({ where }),
    ]);
    return paginated(rows.map((r) => toRow("stay", r)), total, p);
  }
  if (vertical === "car") {
    const [rows, total] = await Promise.all([
      prisma.carBooking.findMany({ where, orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take, select: SELECT }),
      prisma.carBooking.count({ where }),
    ]);
    return paginated(rows.map((r) => toRow("car", r)), total, p);
  }

  // "all" — merge recent rows from each table.
  const window = p.skip + p.take;
  const [flights, stays, cars, fc, sc, cc] = await Promise.all([
    prisma.booking.findMany({ where, orderBy: { createdAt: "desc" }, take: window, select: SELECT }),
    prisma.stayBooking.findMany({ where, orderBy: { createdAt: "desc" }, take: window, select: SELECT }),
    prisma.carBooking.findMany({ where, orderBy: { createdAt: "desc" }, take: window, select: SELECT }),
    prisma.booking.count({ where }),
    prisma.stayBooking.count({ where }),
    prisma.carBooking.count({ where }),
  ]);
  const merged = [
    ...flights.map((r) => toRow("flight", r)),
    ...stays.map((r) => toRow("stay", r)),
    ...cars.map((r) => toRow("car", r)),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return paginated(merged.slice(p.skip, p.skip + p.take), fc + sc + cc, p);
}
