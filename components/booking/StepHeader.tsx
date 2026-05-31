"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  { key: "review", label: "Review trip" },
  { key: "travellers", label: "Travellers" },
  { key: "payment", label: "Payment" },
  { key: "confirm", label: "Review & book" },
] as const;

export type WizardStep = (typeof STEPS)[number]["key"];

export function StepHeader({ current }: { current: WizardStep }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold",
                done
                  ? "btn-accent border-transparent"
                  : active
                    ? "border-price text-price"
                    : "border-border text-muted",
              )}
            >
              {done ? <Check className="h-3 w-3 text-white" /> : i + 1}
            </span>
            <span className={cn("font-medium", active || done ? "text-text" : "text-muted")}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <span className="text-muted">/</span>}
          </li>
        );
      })}
    </ol>
  );
}
