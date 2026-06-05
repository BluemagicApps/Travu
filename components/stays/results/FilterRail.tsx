"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import type { FacetOption, StayFacets, StayFilterState } from "@/lib/stays/facets";
import { PriceHistogramSlider } from "./PriceHistogramSlider";

const LABEL_KEYS = new Set([
  "wifi", "ac", "pool", "parking", "gym", "spa", "bar", "breakfast", "pet_friendly",
  "pay_later", "fully_refundable", "business", "family", "budget", "adults_only",
  "studio", "1", "2",
]);

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
  label,
  emptyText,
  seeLess,
  seeMore,
  initial = 5,
}: {
  options: FacetOption[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  label: (key: string) => string;
  emptyText: string;
  seeLess: string;
  seeMore: (n: number) => string;
  initial?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (options.length === 0) return <p className="text-xs text-muted">{emptyText}</p>;
  const shown = expanded ? options : options.slice(0, initial);
  return (
    <div className="space-y-1.5">
      {shown.map((o) => (
        <label key={o.key} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={selected.has(o.key)} onChange={() => onToggle(o.key)} />
          <span className="flex-1 capitalize">{label(o.key)}</span>
          <span className="text-xs text-muted">{o.count}</span>
        </label>
      ))}
      {options.length > initial && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-xs font-semibold text-price hover:underline"
        >
          {expanded ? seeLess : seeMore(options.length - initial)}
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

export function FilterRail({
  facets,
  state,
  onChange,
}: {
  facets: StayFacets;
  state: StayFilterState;
  onChange: (next: StayFilterState) => void;
}) {
  const t = useTranslations("stays");
  const set = (patch: Partial<StayFilterState>) => onChange({ ...state, ...patch });
  const label = (key: string): string =>
    LABEL_KEYS.has(key) ? t(`filters.labels.${key}`) : key.replace(/_/g, " ");
  const emptyText = t("filters.noneAvailable");
  const seeLess = t("filters.seeLess");
  const seeMore = (n: number) => t("filters.seeMore", { count: n });
  const listProps = { label, emptyText, seeLess, seeMore };

  return (
    <div className="text-sm">
      <Section title={t("filters.searchByName")}>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={state.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder={t("filters.searchByNamePlaceholder")}
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
          <CheckboxList {...listProps} options={facets.popular} selected={state.popular} onToggle={(k) => set({ popular: toggle(state.popular, k) })} />
        </Section>
      )}

      <Section title={t("filters.guestRating")}>
        <div className="space-y-1.5">
          {[
            { v: 0, label: t("filters.ratingAny") },
            { v: 9, label: t("filters.ratingWonderful") },
            { v: 8, label: t("filters.ratingVeryGood") },
            { v: 7, label: t("filters.ratingGood") },
          ].map((o) => (
            <label key={o.v} className="flex items-center gap-2">
              <input
                type="radio"
                name="guestRating"
                checked={state.guestRating === o.v}
                onChange={() => set({ guestRating: o.v as StayFilterState["guestRating"] })}
              />
              {o.label}
            </label>
          ))}
        </div>
      </Section>

      <Section title={t("filters.starRating")}>
        <div className="space-y-1.5">
          {["5", "4", "3", "2"].map((k) => {
            const opt = facets.stars.find((s) => s.key === k);
            const n = Number(k);
            return (
              <label key={k} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={state.stars.has(n)}
                  onChange={() => {
                    const next = new Set(state.stars);
                    if (next.has(n)) next.delete(n);
                    else next.add(n);
                    set({ stars: next });
                  }}
                />
                <span className="flex-1">{t("filters.stars", { count: n })}</span>
                <span className="text-xs text-muted">{opt?.count ?? 0}</span>
              </label>
            );
          })}
        </div>
      </Section>

      <Section title={t("filters.propertyType")}>
        <div className="space-y-1.5">
          {[
            { v: "all", label: t("filters.typeAll") },
            { v: "hotels", label: t("filters.typeHotelsResorts") },
            { v: "homes", label: t("filters.typeHomesApartments") },
          ].map((o) => (
            <label key={o.v} className="flex items-center gap-2">
              <input
                type="radio"
                name="propertyKind"
                checked={state.propertyKind === o.v}
                onChange={() => set({ propertyKind: o.v as StayFilterState["propertyKind"] })}
              />
              {o.label}
            </label>
          ))}
        </div>
      </Section>

      {facets.propertyAmenities.length > 0 && (
        <Section title={t("filters.propertyAmenities")}>
          <CheckboxList {...listProps} options={facets.propertyAmenities} selected={state.propertyAmenities} onToggle={(k) => set({ propertyAmenities: toggle(state.propertyAmenities, k) })} />
        </Section>
      )}

      {facets.roomAmenities.length > 0 && (
        <Section title={t("filters.roomAmenities")}>
          <CheckboxList {...listProps} options={facets.roomAmenities} selected={state.roomAmenities} onToggle={(k) => set({ roomAmenities: toggle(state.roomAmenities, k) })} />
        </Section>
      )}

      {facets.roomViews.length > 0 && (
        <Section title={t("filters.roomViews")}>
          <CheckboxList {...listProps} options={facets.roomViews} selected={state.roomViews} onToggle={(k) => set({ roomViews: toggle(state.roomViews, k) })} />
        </Section>
      )}

      {facets.brands.length > 0 && (
        <Section title={t("filters.propertyBrand")}>
          <CheckboxList {...listProps} options={facets.brands} selected={state.brands} onToggle={(k) => set({ brands: toggle(state.brands, k) })} />
        </Section>
      )}

      {facets.paymentTypes.length > 0 && (
        <Section title={t("filters.paymentType")}>
          <CheckboxList {...listProps} options={facets.paymentTypes} selected={state.paymentTypes} onToggle={(k) => set({ paymentTypes: toggle(state.paymentTypes, k) })} />
        </Section>
      )}

      {facets.cancellation.length > 0 && (
        <Section title={t("filters.cancellationOptions")}>
          <CheckboxList {...listProps} options={facets.cancellation} selected={state.cancellation} onToggle={(k) => set({ cancellation: toggle(state.cancellation, k) })} />
        </Section>
      )}

      {facets.travelerExperience.length > 0 && (
        <Section title={t("filters.travelerExperience")}>
          <CheckboxList {...listProps} options={facets.travelerExperience} selected={state.travelerExperience} onToggle={(k) => set({ travelerExperience: toggle(state.travelerExperience, k) })} />
        </Section>
      )}

      {facets.mealPlans.length > 0 && (
        <Section title={t("filters.mealPlans")}>
          <CheckboxList {...listProps} options={facets.mealPlans} selected={state.mealPlans} onToggle={(k) => set({ mealPlans: toggle(state.mealPlans, k) })} />
        </Section>
      )}

      {facets.bedrooms.length > 0 && (
        <Section title={t("filters.numberOfBedrooms")}>
          <CheckboxList {...listProps} options={facets.bedrooms} selected={state.bedrooms} onToggle={(k) => set({ bedrooms: toggle(state.bedrooms, k) })} initial={3} />
        </Section>
      )}

      <Section title={t("filters.moreOptions")}>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={state.availableOnly} onChange={(e) => set({ availableOnly: e.target.checked })} />
            {t("filters.onlyAvailable")}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={state.beachAccess} onChange={(e) => set({ beachAccess: e.target.checked })} />
            {t("filters.beachAccess")}
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
