import { prisma } from "@/lib/db/prisma";
import { type PageParams, paginated, type Paginated } from "./pagination";
import type { Role } from "@/lib/auth/roles";

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  tier: string | null;
  points: number;
  bookings: number;
}

function whereFor(q: string) {
  if (!q) return {};
  return {
    OR: [
      { email: { contains: q, mode: "insensitive" as const } },
      { name: { contains: q, mode: "insensitive" as const } },
    ],
  };
}

export async function listUsers(q: string, p: PageParams): Promise<Paginated<AdminUserRow>> {
  const where = whereFor(q);
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: p.skip,
      take: p.take,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        membership: { select: { tier: true, pointsBalance: true } },
        _count: { select: { bookings: true, stayBookings: true, carBookings: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    tier: u.membership?.tier ?? null,
    points: u.membership?.pointsBalance ?? 0,
    bookings: u._count.bookings + u._count.stayBookings + u._count.carBookings,
  }));
  return paginated(rows, total, p);
}

export interface AdminUserDetail {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  membership: { tier: string; pointsBalance: number; lifetimePoints: number; tripElements: number } | null;
  bookings: { vertical: "flight" | "stay" | "car"; ref: string; total: number; status: string; createdAt: string }[];
}

export async function getUserDetail(id: string): Promise<AdminUserDetail | null> {
  const u = await prisma.user.findUnique({
    where: { id },
    include: { membership: true, bookings: true, stayBookings: true, carBookings: true },
  });
  if (!u) return null;
  const bookings = [
    ...u.bookings.map((b) => ({ vertical: "flight" as const, ref: b.bookingRef, total: b.totalAmount, status: b.status, createdAt: b.createdAt })),
    ...u.stayBookings.map((b) => ({ vertical: "stay" as const, ref: b.bookingRef, total: b.totalAmount, status: b.status, createdAt: b.createdAt })),
    ...u.carBookings.map((b) => ({ vertical: "car" as const, ref: b.bookingRef, total: b.totalAmount, status: b.status, createdAt: b.createdAt })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((b) => ({ ...b, createdAt: b.createdAt.toISOString() }));
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    membership: u.membership
      ? {
          tier: u.membership.tier,
          pointsBalance: u.membership.pointsBalance,
          lifetimePoints: u.membership.lifetimePoints,
          tripElements: u.membership.tripElements,
        }
      : null,
    bookings,
  };
}

export async function setUserRole(id: string, role: Role): Promise<void> {
  await prisma.user.update({ where: { id }, data: { role } });
}
