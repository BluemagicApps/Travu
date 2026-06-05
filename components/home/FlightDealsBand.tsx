import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, MapPin, Plane } from "lucide-react";

const PINS = [
  { top: "28%", left: "18%" },
  { top: "42%", left: "34%" },
  { top: "33%", left: "52%" },
  { top: "55%", left: "63%" },
  { top: "30%", left: "78%" },
  { top: "62%", left: "44%" },
];

/**
 * "Flight deals from {city}" band with a stylised world map and a CTA — mirrors
 * the Expedia home deals map (img1/img2), adapted to Travu's brand.
 */
export function FlightDealsBand({ city }: { city: string }) {
  const t = useTranslations("homeSections");
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h2 className="mb-4 text-2xl font-extrabold tracking-tight">
        {t("flightDeals.heading", { city })}
      </h2>

      <div className="relative overflow-hidden rounded-3xl border border-border">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
          }}
        />
        {/* faux-map dot grid */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.55) 1.2px, transparent 1.2px)",
            backgroundSize: "22px 22px",
          }}
        />

        {PINS.map((p, i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-full text-white/90"
            style={{ top: p.top, left: p.left }}
          >
            <MapPin className="h-6 w-6 drop-shadow" fill="currentColor" />
          </span>
        ))}

        <div className="relative flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center text-white">
          <Plane className="mb-3 h-8 w-8" />
          <p className="max-w-md text-lg font-semibold">
            {t("flightDeals.tagline")}
          </p>
          <Link
            href="/search"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-white"
          >
            {t("flightDeals.cta")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
