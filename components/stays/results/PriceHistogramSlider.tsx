"use client";

import { Money } from "@/components/Money";

/** Dual-thumb price range over a histogram of the result set. */
export function PriceHistogramSlider({
  min,
  max,
  histogram,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number;
  max: number;
  histogram: number[];
  valueMin: number | null;
  valueMax: number | null;
  onChange: (lo: number | null, hi: number | null) => void;
}) {
  const lo = valueMin ?? min;
  const hi = valueMax ?? max;
  const peak = Math.max(1, ...histogram);
  const step = Math.max(1000, Math.round((max - min) / 50 / 1000) * 1000);

  return (
    <div>
      <div className="flex h-12 items-end gap-0.5">
        {histogram.map((c, i) => {
          const bucketLo = min + ((max - min) * i) / histogram.length;
          const bucketHi = min + ((max - min) * (i + 1)) / histogram.length;
          const inRange = bucketHi >= lo && bucketLo <= hi;
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm ${inRange ? "bg-price/70" : "bg-surface-2"}`}
              style={{ height: `${Math.max(6, (c / peak) * 100)}%` }}
            />
          );
        })}
      </div>
      <div className="relative mt-2 h-5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), hi - step);
            onChange(v <= min ? null : v, valueMax);
          }}
          className="absolute inset-x-0 top-1.5 w-full appearance-none bg-transparent"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), lo + step);
            onChange(valueMin, v >= max ? null : v);
          }}
          className="absolute inset-x-0 top-1.5 w-full appearance-none bg-transparent"
          aria-label="Maximum price"
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span><Money cents={lo} /></span>
        <span>
          <Money cents={hi} />
          {hi >= max ? "+" : ""}
        </span>
      </div>
    </div>
  );
}
