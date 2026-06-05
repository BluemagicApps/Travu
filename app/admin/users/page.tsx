"use client";

import Link from "next/link";
import { AdminTable, type Column } from "@/components/admin/AdminTable";

interface Row {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tier: string | null;
  points: number;
  bookings: number;
  createdAt: string;
}

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

const columns: Column<Row>[] = [
  {
    header: "Email",
    cell: (r) => (
      <Link href={`/admin/users/${r.id}`} className="font-medium text-price hover:underline">
        {r.email}
      </Link>
    ),
  },
  { header: "Name", cell: (r) => r.name ?? "—" },
  {
    header: "Role",
    cell: (r) =>
      r.role === "ADMIN" ? (
        <span className="rounded bg-price/10 px-2 py-0.5 text-xs font-bold text-price">ADMIN</span>
      ) : (
        <span className="text-muted">USER</span>
      ),
  },
  { header: "Tier", cell: (r) => r.tier ?? "—" },
  { header: "Balance", cell: (r) => usd(r.points) },
  { header: "Bookings", cell: (r) => r.bookings },
];

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Users</h1>
      <AdminTable endpoint="/api/admin/users" columns={columns} searchPlaceholder="Search by email or name…" />
    </div>
  );
}
