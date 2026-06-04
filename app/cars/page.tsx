import { Suspense } from "react";
import { Car } from "lucide-react";
import { CarFilter, paramsFromFilter } from "@/lib/cars/schema";
import { searchCars } from "@/lib/cars/search";
import { generateCars } from "@/lib/cars/mock/generator";
import { addDays, todayIso } from "@/lib/utils/dates";
import type { Car as CarOffer } from "@/lib/cars/types";
import { CarSearchCard } from "@/components/cars/CarSearchCard";
import { CarsResultsSkeleton } from "@/components/cars/CarsResultsSkeleton";
import { CarResultsView } from "@/components/cars/CarResultsView";
import { CarsHero } from "@/components/cars/landing/CarsHero";
import { CarDealsBand } from "@/components/cars/landing/CarDealsBand";
import { PromoBanner } from "@/components/home/PromoBanner";
import { ValueProps } from "@/components/home/ValueProps";

async function CarsResults({ filter }: { filter: CarFilter }) {
  const cars = await searchCars(paramsFromFilter(filter));
  if (cars.length === 0) {
    return (
      <div className="glass mt-6 rounded-2xl p-10 text-center text-muted">
        <Car className="mx-auto h-8 w-8 text-price" />
        <p className="mt-3">No cars found — try different dates or a nearby location.</p>
      </div>
    );
  }
  return <CarResultsView cars={cars} capped={cars.length >= 54} />;
}

/** Top discounted cars for a city, for the landing deals bands. */
function dealCars(city: string, count: number): CarOffer[] {
  const pickupDate = addDays(todayIso(), 14);
  const returnDate = addDays(pickupDate, 3);
  return generateCars({ pickup: city, dropoff: city, pickupDate, returnDate })
    .filter((c) => c.originalPrice != null && c.originalPrice > c.totalPrice)
    .sort((a, b) => b.originalPrice! - b.totalPrice - (a.originalPrice! - a.totalPrice))
    .slice(0, count);
}

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const parsed = CarFilter.safeParse(sp);
  const filter = parsed.success ? parsed.data : null;

  // ── No search params → full Expedia-style landing page ──
  if (!filter) {
    return (
      <div>
        <CarsHero />
        <CarDealsBand title="Rent a car in London" cars={dealCars("London", 8)} />
        <PromoBanner />
        <CarDealsBand title="Top deals in Dubai" cars={dealCars("Dubai", 8)} />
        <ValueProps />
      </div>
    );
  }

  // ── Search params present → results page ──
  const initial = {
    pickup: filter.pickup,
    dropoff: filter.dropoff,
    pickupDate: filter.pickupDate,
    returnDate: filter.returnDate,
    pickupTime: filter.pickupTime,
    dropoffTime: filter.dropoffTime,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <CarSearchCard initial={initial} />
      <Suspense key={JSON.stringify(sp)} fallback={<CarsResultsSkeleton />}>
        <CarsResults filter={filter} />
      </Suspense>
    </div>
  );
}
