import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getUserDetail } from "@/lib/admin/users";
import { RoleToggle } from "@/components/admin/RoleToggle";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await getUserDetail(id);
  if (!u) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-text">
        <ChevronLeft className="h-4 w-4" /> Users
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{u.name ?? u.email}</h1>
          <p className="text-sm text-muted">{u.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              u.role === "ADMIN"
                ? "rounded bg-price/10 px-2 py-1 text-xs font-bold text-price"
                : "rounded bg-surface-2 px-2 py-1 text-xs font-bold text-muted"
            }
          >
            {u.role}
          </span>
          <RoleToggle userId={u.id} role={u.role} />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="glass rounded-2xl p-4">
          <h2 className="text-sm font-bold">OneToken</h2>
          {u.membership ? (
            <dl className="mt-2 space-y-1 text-sm text-muted">
              <div className="flex justify-between"><dt>Tier</dt><dd className="font-semibold text-text">{u.membership.tier}</dd></div>
              <div className="flex justify-between"><dt>Balance</dt><dd className="font-semibold text-text">{usd(u.membership.pointsBalance)}</dd></div>
              <div className="flex justify-between"><dt>Lifetime</dt><dd>{usd(u.membership.lifetimePoints)}</dd></div>
              <div className="flex justify-between"><dt>Trip elements</dt><dd>{u.membership.tripElements}</dd></div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-muted">Not a member.</p>
          )}
        </div>
        <div className="glass rounded-2xl p-4">
          <h2 className="text-sm font-bold">Account</h2>
          <dl className="mt-2 space-y-1 text-sm text-muted">
            <div className="flex justify-between"><dt>User ID</dt><dd className="font-mono text-xs">{u.id}</dd></div>
            <div className="flex justify-between"><dt>Joined</dt><dd>{new Date(u.createdAt).toLocaleDateString()}</dd></div>
            <div className="flex justify-between"><dt>Bookings</dt><dd>{u.bookings.length}</dd></div>
          </dl>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold">Bookings</h2>
        {u.bookings.length === 0 ? (
          <p className="text-sm text-muted">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Ref</th>
                  <th className="px-3 py-2.5 font-semibold">Type</th>
                  <th className="px-3 py-2.5 font-semibold">Total</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {u.bookings.map((b) => (
                  <tr key={`${b.vertical}-${b.ref}`} className="border-t border-border">
                    <td className="px-3 py-2.5 font-mono text-xs font-semibold">{b.ref}</td>
                    <td className="px-3 py-2.5 capitalize">{b.vertical}</td>
                    <td className="px-3 py-2.5">{usd(b.total)}</td>
                    <td className="px-3 py-2.5 text-emerald-500">{b.status}</td>
                    <td className="px-3 py-2.5">{new Date(b.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
