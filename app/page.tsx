import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getAirportOptions } from "@/lib/flights/dataset";
import { getServerLocation } from "@/lib/geo/ip-location";
import { HomeSearch } from "@/components/layout/HomeSearch";
import { FlightDealsBand } from "@/components/home/FlightDealsBand";
import { PromoBanner } from "@/components/home/PromoBanner";
import { StayLikeALocal } from "@/components/home/StayLikeALocal";
import { TravelStyles } from "@/components/home/TravelStyles";
import { ExploreWorld } from "@/components/home/ExploreWorld";
import { ValueProps } from "@/components/home/ValueProps";
import { Reveal } from "@/components/layout/Reveal";

export default async function Home() {
  const [airports, location, t] = await Promise.all([
    getAirportOptions(),
    getServerLocation(),
    getTranslations("home"),
  ]);
  const city = location.city || "your city";

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ backgroundImage: "linear-gradient(to right, var(--accent-from), var(--accent-to))" }}
      />

      <section className="mx-auto max-w-4xl px-4 pt-24 pb-16 text-center sm:pt-28">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted shadow-[var(--shadow-sm)]">
          <Sparkles className="h-3.5 w-3.5" /> {t("eyebrow")}
        </span>

        <h1 className="mt-7 text-5xl font-extrabold tracking-display sm:text-7xl">
          {t("tagline")}
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg text-muted sm:text-xl">{t("subtitle")}</p>

        <div className="mx-auto mt-10 max-w-2xl">
          <HomeSearch airports={airports} />
        </div>
      </section>

      <Reveal><FlightDealsBand city={city} /></Reveal>
      <Reveal><PromoBanner /></Reveal>
      <Reveal><ValueProps /></Reveal>
      <Reveal><StayLikeALocal city={city} /></Reveal>
      <Reveal><TravelStyles /></Reveal>
      <Reveal><ExploreWorld /></Reveal>
    </div>
  );
}
