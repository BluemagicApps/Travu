import type { Car } from "@/lib/cars/types";
import type { ProtectionPlanId } from "@/lib/cars/pricing";
import { computeCarPrice } from "@/lib/cars/pricing";
import { Money } from "@/components/Money";

/** Right-side price summary. Pure render of computeCarPrice (server source of truth). */
export function CarBookingSummary({
  car,
  plan = "NONE",
  driverAge,
}: {
  car: Car;
  plan?: ProtectionPlanId;
  driverAge?: number;
}) {
  const p = computeCarPrice(car, plan, driverAge);
  return (
    <aside className="glass h-fit rounded-2xl p-4 text-sm lg:sticky lg:top-24">
      <div className="flex gap-3">
        {car.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={car.image} alt={car.exampleModel} className="h-16 w-16 rounded-lg object-cover" />
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-price">{car.carClass}</p>
          <h2 className="truncate font-semibold">{car.exampleModel}</h2>
          <div className="mt-0.5 text-xs text-muted">
            <span className="rounded bg-price px-1.5 py-0.5 font-bold text-white">{car.vendorRating.toFixed(1)}</span>{" "}
            {car.vendor}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1 border-t border-border pt-3 text-muted">
        <div className="flex justify-between"><span>Pick-up</span><span className="text-right text-text">{car.pickupLocation}<br />{car.pickupDate}{car.pickupTime ? ` · ${car.pickupTime}` : ""}</span></div>
        <div className="flex justify-between"><span>Drop-off</span><span className="text-right text-text">{car.dropoffLocation}<br />{car.returnDate}{car.dropoffTime ? ` · ${car.dropoffTime}` : ""}</span></div>
        <div className="flex justify-between"><span>Transmission</span><span className="text-text">{car.transmission === "automatic" ? "Automatic" : "Manual"}</span></div>
        <div className="flex justify-between"><span>Mileage</span><span className="text-text">{car.mileage}</span></div>
      </div>

      <div className="mt-3 space-y-1 border-t border-border pt-3 text-muted">
        <div className="flex justify-between">
          <span><Money cents={car.pricePerDay} /> × {p.rentalDays} day{p.rentalDays === 1 ? "" : "s"}</span>
          <span className="text-text"><Money cents={p.baseRate} /></span>
        </div>
        <div className="flex justify-between"><span>Taxes</span><span className="text-text"><Money cents={p.taxes} /></span></div>
        <div className="flex justify-between"><span>Booking fee</span><span className="text-text"><Money cents={p.fees} /></span></div>
        {p.protection > 0 && (
          <div className="flex justify-between"><span>Full protection</span><span className="text-text"><Money cents={p.protection} /></span></div>
        )}
        {p.youngDriverFee > 0 && (
          <div className="flex justify-between"><span>Young driver fee</span><span className="text-text"><Money cents={p.youngDriverFee} /></span></div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="font-semibold">Total</span>
        <span className="text-lg font-extrabold text-price"><Money cents={p.total} /></span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted">
        <span>Pay today</span>
        <span><Money cents={p.payToday} /></span>
      </div>
    </aside>
  );
}
