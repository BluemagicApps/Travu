import { Sparkles, Plane, ShieldCheck, Clock } from "lucide-react";
import type { ComponentType } from "react";
import { getAirportOptions } from "@/lib/flights/dataset";
import { SearchForm } from "@/components/search/SearchForm";
import { AiSearchBar } from "@/components/search/AiSearchBar";

export default async function Home() {
  const airports = await getAirportOptions();
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

        <div className="mx-auto mt-8 max-w-2xl">
          <AiSearchBar />
          <div className="my-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            or search manually
            <span className="h-px flex-1 bg-border" />
          </div>
          <SearchForm airports={airports} />
        </div>
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
