import Link from "next/link";
import { useTranslations } from "next-intl";
import { Users, Briefcase, Cog } from "lucide-react";
import type { Car } from "@/lib/cars/types";
import { Money } from "@/components/Money";

/** Horizontal "Rent a car in {city}" deals band — mirrors the Expedia deal rows. */
export function CarDealsBand({ title, cars }: { title: string; cars: Car[] }) {
  const t = useTranslations("cars");
  if (cars.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <h2 className="mb-3 text-2xl font-extrabold tracking-tight">{title}</h2>
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {cars.map((car) => (
          <Link
            key={car.id}
            href={`/book/car/${car.id}`}
            className="group w-60 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-lg"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={car.image}
                alt={car.exampleModel}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              {car.originalPrice != null && car.originalPrice > car.totalPrice && (
                <span className="absolute left-2 top-2 rounded-md bg-rose-600 px-2 py-1 text-[10px] font-bold text-white">
                  {t("card.deal")}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-price">{car.carClass}</p>
              <p className="truncate font-bold">{car.exampleModel}</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {car.seats}</span>
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {car.bags}</span>
                <span className="flex items-center gap-1"><Cog className="h-3.5 w-3.5" /> {car.transmission === "automatic" ? t("card.auto") : t("card.manual")}</span>
              </p>
              <p className="mt-2 text-sm font-extrabold">
                <Money cents={car.pricePerDay} />
                <span className="ml-1 text-xs font-normal text-muted">{t("card.perDayVendor", { vendor: car.vendor })}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
