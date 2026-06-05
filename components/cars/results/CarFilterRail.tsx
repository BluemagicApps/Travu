"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import type { FacetOption, CarFacets, CarFilterState } from "@/lib/cars/facets";
import { PriceHistogramSlider } from "@/components/stays/results/PriceHistogramSlider";

type Translate = ReturnType<typeof useTranslations>;

// Maps facet keys to translation keys under cars.filters.option.*. Keys not
// listed (e.g. provider car classes like "SUV") fall back to the raw key.
const LABEL_KEYS: Record<string, string> = {
  automatic: "automatic",
  manual: "manual",
  Unlimited: "unlimitedMileage",
  Limited: "limitedMileage",
  "Automatic transmission": "automatic",
  "Air conditioning": "airConditioning",
  "Free cancellation": "freeCancellation",
  "Unlimited mileage": "unlimitedMileage",
  "4": "seats4",
  "5": "seats5",
  "7+": "seats7plus",
};
function label(t: Translate, key: string): string {
  const k = LABEL_KEYS[key];
  return k ? t(`filters.option.${k}`) : key;
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
  t,
  options,
  selected,
  onToggle,
  initial = 5,
}: {
  t: Translate;
  options: FacetOption[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  initial?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (options.length === 0) return <p className="text-xs text-muted">{t("filters.noneAvailable")}</p>;
  const shown = expanded ? options : options.slice(0, initial);
  return (
    <div className="space-y-1.5">
      {shown.map((o) => (
        <label key={o.key} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={selected.has(o.key)} onChange={() => onToggle(o.key)} />
          <span className="flex-1">{label(t, o.key)}</span>
          <span className="text-xs text-muted">{o.count}</span>
        </label>
      ))}
      {options.length > initial && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-xs font-semibold text-price hover:underline"
        >
          {expanded ? t("filters.seeLess") : t("filters.seeMore", { count: options.length - initial })}
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
  const t = useTranslations("cars");
  const set = (patch: Partial<CarFilterState>) => onChange({ ...state, ...patch });

  return (
    <div className="text-sm">
      <Section title={t("filters.searchByCarOrCompany")}>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={state.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder={t("filters.searchPlaceholder")}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </Section>

      <Section title={t("filters.totalPrice")}>
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
        <Section title={t("filters.popularFilters")}>
          <CheckboxList t={t} options={facets.popular} selected={state.popular} onToggle={(k) => set({ popular: toggle(state.popular, k) })} />
        </Section>
      )}

      <Section title={t("filters.rating")}>
        <div className="space-y-1.5">
          {[
            { v: 0, label: t("filters.ratingAny") },
            { v: 9, label: t("filters.ratingExceptional") },
            { v: 8, label: t("filters.ratingVeryGood") },
            { v: 7, label: t("filters.ratingGood") },
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
        <Section title={t("filters.carType")}>
          <CheckboxList t={t} options={facets.carClasses} selected={state.carClasses} onToggle={(k) => set({ carClasses: toggle(state.carClasses, k) })} initial={6} />
        </Section>
      )}

      {facets.seats.length > 0 && (
        <Section title={t("filters.capacity")}>
          <CheckboxList t={t} options={facets.seats} selected={state.seats} onToggle={(k) => set({ seats: toggle(state.seats, k) })} />
        </Section>
      )}

      {facets.vendors.length > 0 && (
        <Section title={t("filters.rentalCompany")}>
          <CheckboxList t={t} options={facets.vendors} selected={state.vendors} onToggle={(k) => set({ vendors: toggle(state.vendors, k) })} />
        </Section>
      )}

      {facets.transmissions.length > 0 && (
        <Section title={t("filters.transmission")}>
          <CheckboxList t={t} options={facets.transmissions} selected={state.transmissions} onToggle={(k) => set({ transmissions: toggle(state.transmissions, k) })} />
        </Section>
      )}

      {facets.mileage.length > 0 && (
        <Section title={t("filters.mileage")}>
          <CheckboxList t={t} options={facets.mileage} selected={state.mileage} onToggle={(k) => set({ mileage: toggle(state.mileage, k) })} />
        </Section>
      )}

      <Section title={t("filters.moreOptions")}>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={state.refundableOnly} onChange={(e) => set({ refundableOnly: e.target.checked })} />
            {t("filters.freeCancellationOnly")}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={state.memberDeals} onChange={(e) => set({ memberDeals: e.target.checked })} />
            {t("filters.memberDeals")}
          </label>
        </div>
      </Section>
    </div>
  );
}
