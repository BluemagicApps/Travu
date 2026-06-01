"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { FacetOption, StayFacets, StayFilterState } from "@/lib/stays/facets";
import { PriceHistogramSlider } from "./PriceHistogramSlider";

const LABELS: Record<string, string> = {
  wifi: "Free WiFi",
  ac: "Air conditioning",
  pool: "Pool",
  parking: "Parking",
  gym: "Gym",
  spa: "Spa",
  bar: "Bar",
  breakfast: "Breakfast",
  pet_friendly: "Pet friendly",
  pay_later: "Reserve now, pay later",
  fully_refundable: "Fully refundable",
  business: "Business friendly",
  family: "Family friendly",
  budget: "Budget",
  adults_only: "Adults only",
  studio: "Studio",
  "1": "1 bedroom",
  "2": "2+ bedrooms",
};
function label(key: string): string {
  return LABELS[key] ?? key.replace(/_/g, " ");
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

export function FilterRail({
  facets,
  state,
  onChange,
}: {
  facets: StayFacets;
  state: StayFilterState;
  onChange: (next: StayFilterState) => void;
}) {
  const set = (patch: Partial<StayFilterState>) => onChange({ ...state, ...patch });

  return (
    <div className="text-sm">
      <Section title="Search by property name">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={state.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. Grand"
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

      <Section title="Guest rating">
        <div className="space-y-1.5">
          {[
            { v: 0, label: "Any" },
            { v: 9, label: "Wonderful 9+" },
            { v: 8, label: "Very good 8+" },
            { v: 7, label: "Good 7+" },
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

      <Section title="Star rating">
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
                <span className="flex-1">{k} stars</span>
                <span className="text-xs text-muted">{opt?.count ?? 0}</span>
              </label>
            );
          })}
        </div>
      </Section>

      <Section title="Property type">
        <div className="space-y-1.5">
          {[
            { v: "all", label: "All" },
            { v: "hotels", label: "Hotels & resorts" },
            { v: "homes", label: "Homes & apartments" },
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
        <Section title="Property amenities">
          <CheckboxList options={facets.propertyAmenities} selected={state.propertyAmenities} onToggle={(k) => set({ propertyAmenities: toggle(state.propertyAmenities, k) })} />
        </Section>
      )}

      {facets.roomAmenities.length > 0 && (
        <Section title="Room amenities">
          <CheckboxList options={facets.roomAmenities} selected={state.roomAmenities} onToggle={(k) => set({ roomAmenities: toggle(state.roomAmenities, k) })} />
        </Section>
      )}

      {facets.roomViews.length > 0 && (
        <Section title="Room views">
          <CheckboxList options={facets.roomViews} selected={state.roomViews} onToggle={(k) => set({ roomViews: toggle(state.roomViews, k) })} />
        </Section>
      )}

      {facets.brands.length > 0 && (
        <Section title="Property brand">
          <CheckboxList options={facets.brands} selected={state.brands} onToggle={(k) => set({ brands: toggle(state.brands, k) })} />
        </Section>
      )}

      {facets.paymentTypes.length > 0 && (
        <Section title="Payment type">
          <CheckboxList options={facets.paymentTypes} selected={state.paymentTypes} onToggle={(k) => set({ paymentTypes: toggle(state.paymentTypes, k) })} />
        </Section>
      )}

      {facets.cancellation.length > 0 && (
        <Section title="Cancellation options">
          <CheckboxList options={facets.cancellation} selected={state.cancellation} onToggle={(k) => set({ cancellation: toggle(state.cancellation, k) })} />
        </Section>
      )}

      {facets.travelerExperience.length > 0 && (
        <Section title="Traveler experience">
          <CheckboxList options={facets.travelerExperience} selected={state.travelerExperience} onToggle={(k) => set({ travelerExperience: toggle(state.travelerExperience, k) })} />
        </Section>
      )}

      {facets.mealPlans.length > 0 && (
        <Section title="Meal plans">
          <CheckboxList options={facets.mealPlans} selected={state.mealPlans} onToggle={(k) => set({ mealPlans: toggle(state.mealPlans, k) })} />
        </Section>
      )}

      {facets.bedrooms.length > 0 && (
        <Section title="Number of bedrooms">
          <CheckboxList options={facets.bedrooms} selected={state.bedrooms} onToggle={(k) => set({ bedrooms: toggle(state.bedrooms, k) })} initial={3} />
        </Section>
      )}

      <Section title="More options">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={state.availableOnly} onChange={(e) => set({ availableOnly: e.target.checked })} />
            Only show available properties
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={state.beachAccess} onChange={(e) => set({ beachAccess: e.target.checked })} />
            Beach access
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
