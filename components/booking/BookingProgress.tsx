"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Plane } from "lucide-react";

const DEFAULT_STEPS = [
  "Reviewing booking application",
  "Verifying application data",
  "Booking ticket on airline API",
  "Booking approved",
];

const STEP_MS = 1200; // time spent on each of the first three steps
const APPROVE_HOLD_MS = 800; // dwell on "approved" before navigating

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Full-screen, realistic booking progress overlay. Mounts when a booking is
 * submitted, steps through the pipeline over ~4–6s while the real API call runs
 * in parallel, then resolves: onDone(result) on success or onError(err) on
 * failure. `task` is invoked once on mount and must resolve to the value passed
 * to onDone (e.g. a booking reference).
 */
export function BookingProgress<T>({
  task,
  onDone,
  onError,
  brandLabel = "Travu",
  steps,
  icon,
}: {
  task: () => Promise<T>;
  onDone: (result: T) => void;
  onError: (err: unknown) => void;
  brandLabel?: string;
  /** Override the staged step labels (defaults to the flight booking steps). */
  steps?: string[];
  /** Override the header icon (defaults to a plane). */
  icon?: ComponentType<{ className?: string }>;
}) {
  const STEPS = steps ?? DEFAULT_STEPS;
  const Icon = icon ?? Plane;
  const [active, setActive] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // run the sequence exactly once
    started.current = true;
    let cancelled = false;

    (async () => {
      const taskPromise = task(); // kick off the real booking immediately
      // Pre-empt unhandled-rejection warnings if we error before awaiting.
      taskPromise.catch(() => {});

      for (let i = 0; i < STEPS.length - 1; i++) {
        if (cancelled) return;
        setActive(i);
        await delay(STEP_MS);
      }
      if (cancelled) return;
      setActive(STEPS.length - 1); // "Booking approved" — waits on the API

      let result: T;
      try {
        result = await taskPromise;
      } catch (err) {
        if (!cancelled) onError(err);
        return;
      }
      await delay(APPROVE_HOLD_MS);
      if (!cancelled) onDone(result);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="w-full max-w-md rounded-3xl border border-border bg-surface p-7 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="btn-accent grid h-11 w-11 place-items-center rounded-2xl">
            <Icon className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="text-sm font-bold">{brandLabel} secure booking</p>
            <p className="text-xs text-muted">Please keep this window open…</p>
          </div>
        </div>

        <ol className="space-y-3">
          {STEPS.map((labelText, i) => {
            const isDone = i < active;
            const isActive = i === active;
            return (
              <li key={labelText} className="flex items-center gap-3">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition ${
                    isDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isActive
                        ? "border-sky-400 text-price"
                        : "border-border text-muted"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-[11px] font-bold">{i + 1}</span>
                  )}
                </span>
                <span
                  className={`text-sm font-medium transition ${
                    isDone || isActive ? "text-text" : "text-muted"
                  }`}
                >
                  {labelText}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.span
            className="block h-full btn-accent"
            initial={{ width: "8%" }}
            animate={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
            transition={{ ease: "easeOut", duration: 0.5 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
