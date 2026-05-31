"use client";

import type { StayFacets, StayFilterState } from "@/lib/stays/facets";
import { Money } from "@/components/Money";

export function StaysResultsSidebar({
  facets,
  state,
  onChange,
}: {
  facets: StayFacets;
  state: StayFilterState;
  onChange: (s: StayFilterState) => void;
}) {
  function toggleAmenity(key: string) {
    const next = new Set(state.amenities);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange({ ...state, amenities: next });
  }

  return (
    <aside className="glass h-fit rounded-2xl p-4 text-sm">
      <div>
        <h4 className="font-semibold">Min rating</h4>
        <div className="mt-2 space-y-1">
          {[0, 3, 4, 5].map((s) => (
            <label key={s} className="flex items-center gap-2">
              <input
                type="radio"
                name="minStars"
                checked={state.minStars === s}
                onChange={() => onChange({ ...state, minStars: s })}
              />
              {s === 0 ? "Any" : `${s}+ stars`}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold">Max price (total)</h4>
        <input
          type="range"
          min={facets.minPrice}
          max={facets.maxPrice}
          step={1000}
          value={state.maxPrice ?? facets.maxPrice}
          onChange={(e) => onChange({ ...state, maxPrice: Number(e.target.value) })}
          className="mt-2 w-full"
        />
        <div className="text-xs text-muted">
          Up to <Money cents={state.maxPrice ?? facets.maxPrice} />
        </div>
      </div>

      {facets.amenities.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold">Amenities</h4>
          <div className="mt-2 space-y-1">
            {facets.amenities.slice(0, 8).map((a) => (
              <label key={a.key} className="flex items-center gap-2 capitalize">
                <input
                  type="checkbox"
                  checked={state.amenities.has(a.key)}
                  onChange={() => toggleAmenity(a.key)}
                />
                {a.key.replace(/_/g, " ")} <span className="text-xs text-muted">({a.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
