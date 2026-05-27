import { Sparkles, Plane, ShieldCheck, Clock } from "lucide-react";
import type { ComponentType } from "react";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ backgroundImage: "linear-gradient(to right, var(--accent-from), var(--accent-to))" }}
      />

      <section className="mx-auto max-w-4xl px-4 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
          <Sparkles className="h-3.5 w-3.5" /> AI-powered travel, reinvented
        </span>

        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
          Find your flight in <span className="text-gradient">one sentence.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          {"Tell TRAVU where you want to go, the way you'd tell a friend. We handle the search, the price, and the booking — end to end."}
        </p>

        <div className="glass mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-2xl p-3 text-left">
          <Sparkles className="ml-2 h-5 w-5 text-price" />
          <span className="flex-1 text-muted">
            {'e.g. "cheap nonstop to Dubai mid-June, land before evening"'}
          </span>
          <span className="btn-accent rounded-xl px-5 py-2.5 text-sm font-semibold">Search</span>
        </div>
        <p className="mt-2 text-xs text-muted">Search goes live in the next build step.</p>
      </section>

      <section className="mx-auto grid max-w-4xl gap-4 px-4 pb-24 sm:grid-cols-3">
        <Feature icon={Plane} title="Realistic global flights" desc="Worldwide routes, real airlines, dynamic pricing." />
        <Feature icon={Clock} title="AI price prediction" desc="Know whether to book now or wait." />
        <Feature icon={ShieldCheck} title="Tickets & tracking" desc="Industry-style PDF e-tickets and a bookings dashboard." />
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 text-left">
      <Icon className="h-6 w-6 text-price" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{desc}</p>
    </div>
  );
}
