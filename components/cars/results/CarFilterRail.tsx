"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { FacetOption, CarFacets, CarFilterState } from "@/lib/cars/facets";
import { PriceHistogramSlider } from "@/components/stays/results/PriceHistogramSlider";

const LABELS: Record<string, string> = {
  automatic: "Automatic",
  manual: "Manual",
  Unlimited: "Unlimited mileage",
  Limited: "Limited mileage",
  "Automatic transmission": "Automatic",
  "Air conditioning": "Air conditioning",
  "Free cancellation": "Free cancellation",
  "Unlimited mileage": "Unlimited mileage",
  SUV: "SUV",
  "4": "4 seats",
  "5": "5 seats",
  "7+": "7+ seats",
};
function label(key: string): string {
  return LABELS[key] ?? key;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <h4 className="mb-2 text-sm font-bold">{title}</h4>
      {children}
    </div>
  );
}

function CheckboxList({
  options,
  selected,
  onToggle,
  initial = 5,
}: {
  options: FacetOption[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  initial?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (options.length === 0) return <p className="text-xs text-muted">None available</p>;
  const shown = expanded ? options : options.slice(0, initial);
  return (
    <div className="space-y-1.5">
      {shown.map((o) => (
        <label key={o.key} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={selected.has(o.key)} onChange={() => onToggle(o.key)} />
          <span className="flex-1">{label(o.key)}</span>
          <span className="text-xs text-muted">{o.count}</span>
        </label>
      ))}
      {options.length > initial && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-xs font-semibold text-price hover:underline"
        >
          {expanded ? "See less" : `See more (${options.length - initial})`}
        </button>
      )}
    </div>
  );
}

const toggle = (set: Set<string>, key: string): Set<string> => {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
};

export function CarFilterRail({
  facets,
  state,
  onChange,
}: {
  facets: CarFacets;
  state: CarFilterState;
  onChange: (next: CarFilterState) => void;
}) {
  const set = (patch: Partial<CarFilterState>) => onChange({ ...state, ...patch });

  return (
    <div className="text-sm">
      <Section title="Search by car or company">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={state.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. Sixt or RAV4"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </Section>

      <Section title="Total price">
        <PriceHistogramSlider
          min={facets.minPrice}
          max={facets.maxPrice}
          histogram={facets.priceHistogram}
          valueMin={state.priceMin}
          valueMax={state.priceMax}
          onChange={(lo, hi) => set({ priceMin: lo, priceMax: hi })}
        />
      </Section>

      {facets.popular.length > 0 && (
        <Section title="Popular filters">
          <CheckboxList options={facets.popular} selected={state.popular} onToggle={(k) => set({ popular: toggle(state.popular, k) })} />
        </Section>
      )}

      <Section title="Rating">
        <div className="space-y-1.5">
          {[
            { v: 0, label: "Any" },
            { v: 9, label: "Exceptional 9+" },
            { v: 8, label: "Very good 8+" },
            { v: 7, label: "Good 7+" },
          ].map((o) => (
            <label key={o.v} className="flex items-center gap-2">
              <input
                type="radio"
                name="vendorRating"
                checked={state.vendorRating === o.v}
                onChange={() => set({ vendorRating: o.v as CarFilterState["vendorRating"] })}
              />
              {o.label}
            </label>
          ))}
        </div>
      </Section>

      {facets.carClasses.length > 0 && (
        <Section title="Car type">
          <CheckboxList options={facets.carClasses} selected={state.carClasses} onToggle={(k) => set({ carClasses: toggle(state.carClasses, k) })} initial={6} />
        </Section>
      )}

      {facets.seats.length > 0 && (
        <Section title="Capacity">
          <CheckboxList options={facets.seats} selected={state.seats} onToggle={(k) => set({ seats: toggle(state.seats, k) })} />
        </Section>
      )}

      {facets.vendors.length > 0 && (
        <Section title="Rental company">
          <CheckboxList options={facets.vendors} selected={state.vendors} onToggle={(k) => set({ vendors: toggle(state.vendors, k) })} />
        </Section>
      )}

      {facets.transmissions.length > 0 && (
        <Section title="Transmission">
          <CheckboxList options={facets.transmissions} selected={state.transmissions} onToggle={(k) => set({ transmissions: toggle(state.transmissions, k) })} />
        </Section>
      )}

      {facets.mileage.length > 0 && (
        <Section title="Mileage">
          <CheckboxList options={facets.mileage} selected={state.mileage} onToggle={(k) => set({ mileage: toggle(state.mileage, k) })} />
        </Section>
      )}

      <Section title="More options">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={state.refundableOnly} onChange={(e) => set({ refundableOnly: e.target.checked })} />
            Free cancellation only
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={state.memberDeals} onChange={(e) => set({ memberDeals: e.target.checked })} />
            Member deals &amp; discounts
          </label>
        </div>
      </Section>
    </div>
  );
}
