import type { Fare } from "@/lib/flights/types";
import { Money } from "@/components/Money";

export function FareBreakdown({ fare, passengers = 1 }: { fare: Fare; passengers?: number }) {
  const rows = [
    { label: passengers > 1 ? `Base fare × ${passengers}` : "Base fare", value: fare.base * passengers },
    { label: "Taxes", value: fare.taxes * passengers },
    { label: "Fees", value: fare.fees * passengers },
  ];
  const total = fare.total * passengers;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h3 className="font-semibold">Fare breakdown</h3>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between">
            <dt className="text-muted">{r.label}</dt>
            <dd><Money cents={r.value} /></dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-2 font-bold">
          <dt>Total</dt>
          <dd className="text-price"><Money cents={total} /></dd>
        </div>
      </dl>
    </div>
  );
}
