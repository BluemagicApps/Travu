"use client";

import { motion } from "framer-motion";
import { Check, PlaneTakeoff } from "lucide-react";
import { STATUS_PHASES, phaseIndex, type StatusPhase } from "@/lib/booking/status";
import { cn } from "@/lib/utils/cn";

export function TrackTimeline({ phase }: { phase: StatusPhase }) {
  const current = phaseIndex(phase);
  return (
    <ol className="relative grid grid-cols-3 gap-y-6 sm:grid-cols-6 sm:gap-y-0">
      <span className="absolute left-0 right-0 top-3 hidden h-0.5 bg-border sm:block" aria-hidden />
      <motion.span
        className="absolute left-0 top-3 hidden h-0.5 sm:block"
        style={{ backgroundImage: "linear-gradient(to right, var(--accent-from), var(--accent-to))" }}
        initial={{ width: 0 }}
        animate={{
          width: `${(Math.max(0, current) / (STATUS_PHASES.length - 1)) * 100}%`,
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        aria-hidden
      />
      {STATUS_PHASES.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.key} className="relative flex flex-col items-center">
            <span
              className={cn(
                "relative grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-bold",
                done
                  ? "btn-accent border-transparent text-white"
                  : active
                    ? "border-price bg-surface text-price"
                    : "border-border bg-surface text-muted",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              {active && (
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-price"
                  initial={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  aria-hidden
                />
              )}
              {active && step.key === "in_flight" && (
                <PlaneTakeoff className="absolute -top-5 h-3.5 w-3.5 text-price" />
              )}
            </span>
            <span
              className={cn(
                "mt-2 text-center text-[11px] font-medium",
                active ? "text-text" : done ? "text-text" : "text-muted",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
