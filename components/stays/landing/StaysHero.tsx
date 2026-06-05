import Link from "next/link";
import { Plane, BedDouble } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { StaySearchCard, type StaySearchInitial } from "../StaySearchCard";

/** Expedia-style hero: gradient banner, Flights|Stays tabs, and the search card. */
export async function StaysHero({ initial }: { initial?: StaySearchInitial }) {
  const t = await getTranslations("home");
  return (
    // No overflow-hidden here — it would clip the search dropdowns. The blur blob
    // is clipped by its own wrapper instead.
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ backgroundImage: "linear-gradient(to right, var(--accent-from), var(--accent-to))" }}
        />
      </div>
      <div className="mx-auto max-w-5xl px-4 pt-12 pb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{t("tagline")}</h1>

        {/* Vertical tabs */}
        <div className="mx-auto mt-6 flex w-fit gap-1 rounded-full border border-border bg-surface-2 p-1">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-muted transition hover:text-text"
          >
            <Plane className="h-4 w-4" /> Flights
          </Link>
          <span className="btn-accent flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold shadow">
            <BedDouble className="h-4 w-4" /> Stays
          </span>
        </div>

        {/* relative + high z so the search-card dropdowns paint above the deals carousel below */}
        <div className="relative z-30 mx-auto mt-6 max-w-4xl">
          <StaySearchCard initial={initial} showAi />
        </div>
      </div>
    </section>
  );
}
