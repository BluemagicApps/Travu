import { getOverview } from "@/lib/admin/stats";
import { StatCard } from "@/components/admin/StatCard";

export const dynamic = "force-dynamic";

function usd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function AdminOverviewPage() {
  const o = await getOverview();
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Overview</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Users" value={o.users} sub={`${o.admins} admin${o.admins === 1 ? "" : "s"}`} />
        <StatCard label="OneToken members" value={o.members} />
        <StatCard label="Total revenue" value={usd(o.revenueCents)} sub="all verticals" />
        <StatCard label="Flight bookings" value={o.bookings.flight} />
        <StatCard label="Stay bookings" value={o.bookings.stay} />
        <StatCard label="Car bookings" value={o.bookings.car} />
      </div>
    </div>
  );
}
