"use client";

import { cn } from "@/lib/utils/cn";

export type TripType = "one-way" | "return" | "multi-city";

const TABS: { key: TripType; label: string }[] = [
  { key: "return", label: "Return" },
  { key: "one-way", label: "One-way" },
  { key: "multi-city", label: "Multi-city" },
];

export function TripTypeTabs({
  value,
  onChange,
}: {
  value: TripType;
  onChange: (value: TripType) => void;
}) {
  return (
    <div className="flex w-fit gap-1 rounded-full border border-border bg-surface-2 p-1">
      {TABS.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              active ? "btn-accent shadow" : "text-muted hover:text-text",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
