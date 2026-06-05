"use client";

import { useState } from "react";
import { AdminTable, type Column } from "@/components/admin/AdminTable";

interface Row {
  vertical: string;
  ref: string;
  total: number;
  currency: string;
  status: string;
  email: string | null;
  createdAt: string;
}

const money = (c: number, cur: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur || "USD" }).format(c / 100);

const columns: Column<Row>[] = [
  { header: "Ref", cell: (r) => <span className="font-mono text-xs font-semibold">{r.ref}</span> },
  { header: "Type", cell: (r) => <span className="capitalize">{r.vertical}</span> },
  { header: "Email", cell: (r) => r.email ?? "—" },
  { header: "Total", cell: (r) => money(r.total, r.currency) },
  { header: "Status", cell: (r) => <span className="text-emerald-500">{r.status}</span> },
  { header: "Date", cell: (r) => new Date(r.createdAt).toLocaleDateString() },
];

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "flight", label: "Flights" },
  { key: "stay", label: "Stays" },
  { key: "car", label: "Cars" },
];

export default function AdminBookingsPage() {
  const [vertical, setVertical] = useState("all");
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Bookings</h1>
      <AdminTable
        key={vertical}
        endpoint="/api/admin/bookings"
        columns={columns}
        params={{ vertical }}
        searchPlaceholder="Search by ref or email…"
        toolbar={
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setVertical(t.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  vertical === t.key ? "btn-accent text-white" : "border border-border text-muted hover:text-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />
    </div>
  );
}
