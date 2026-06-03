import { Sparkles } from "lucide-react";
import { getAirportOptions } from "@/lib/flights/dataset";
import { getServerLocation } from "@/lib/geo/ip-location";
import { HomeSearch } from "@/components/layout/HomeSearch";
import { FlightDealsBand } from "@/components/home/FlightDealsBand";
import { PromoBanner } from "@/components/home/PromoBanner";
import { StayLikeALocal } from "@/components/home/StayLikeALocal";
import { TravelStyles } from "@/components/home/TravelStyles";
import { ExploreWorld } from "@/components/home/ExploreWorld";
import { ValueProps } from "@/components/home/ValueProps";

export default async function Home() {
  const [airports, location] = await Promise.all([getAirportOptions(), getServerLocation()]);
  const city = location.city || "your city";

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ backgroundImage: "linear-gradient(to right, var(--accent-from), var(--accent-to))" }}
      />

      <section className="mx-auto max-w-4xl px-4 pt-20 pb-12 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
          <Sparkles className="h-3.5 w-3.5" /> AI-powered travel, reinvented
        </span>

        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
          The one place you go to <span className="text-gradient">go places.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          {"Tell Travu where you want to go, the way you'd tell a friend. Flights and stays — we handle the search, the price, and the booking, end to end."}
        </p>

        <div className="mx-auto mt-8 max-w-2xl">
          <HomeSearch airports={airports} />
        </div>
      </section>

      <FlightDealsBand city={city} />
      <PromoBanner />
      <ValueProps />
      <StayLikeALocal city={city} />
      <TravelStyles />
      <ExploreWorld />
    </div>
  );
}
