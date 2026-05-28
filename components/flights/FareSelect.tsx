"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Flight } from "@/lib/flights/types";
import type { FareOption, FarePerks } from "@/lib/flights/fares";
import { formatUSD } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

export function FareSelect({
  flight,
  options,
  onClose,
}: {
  flight: Flight;
  options: FareOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const to = flight.segments[flight.segments.length - 1];

  function select(opt: FareOption) {
    router.push(`/book/${flight.id}?fare=${opt.id}&step=review`);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        data-testid="fare-modal"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl border border-border bg-surface p-6 shadow-2xl md:inset-x-auto md:bottom-auto md:left-1/2 md:top-12 md:max-h-[80vh] md:w-[min(880px,90vw)] md:-translate-x-1/2 md:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">Select fare to {to.destIata}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted transition hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">This flight is operated by {flight.carrierName}.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {options.map((opt) => (
            <FareCard key={opt.id} opt={opt} onSelect={() => select(opt)} />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function FareCard({ opt, onSelect }: { opt: FareOption; onSelect: () => void }) {
  const p = opt.perks;
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-surface p-4 transition",
        opt.badge ? "border-sky-400 ring-1 ring-sky-400/30" : "border-border",
      )}
    >
      {opt.badge && (
        <div className="mb-2 self-start rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-price dark:bg-sky-500/20">
          {opt.badge}
        </div>
      )}
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-bold">{opt.name}</h3>
        <div className="text-right">
          <div className="text-xl font-extrabold text-price">{formatUSD(opt.fare.total)}</div>
          <div className="text-[10px] text-muted">per traveller</div>
        </div>
      </div>
      <div className="mt-1 text-xs text-muted capitalize">Cabin: {opt.cabin.toLowerCase()}</div>

      <ul className="mt-3 space-y-1.5 text-xs">
        <Perk on={p.seatChoice !== "none"}>
          {p.seatChoice === "free" ? "Seat choice included" : "Seat choice for a fee"}
        </Perk>
        <Perk on={true}>{`Hand baggage included (${p.handBaggageKg} kg)`}</Perk>
        <Perk on={p.checkedBags.count > 0}>
          {p.checkedBags.count > 0
            ? `${p.checkedBags.count} × checked bag (${p.checkedBags.kgEach} kg each)`
            : "Checked bag for a fee"}
        </Perk>
        <Perk on={p.refundable}>{p.refundable ? "Refundable" : "Non-refundable"}</Perk>
        <Perk on={p.changeable === "free"}>
          {p.changeable === "free"
            ? "Free changes"
            : p.changeable === "fee"
              ? "Change fee applies"
              : "Changes not allowed"}
        </Perk>
      </ul>

      <button
        type="button"
        onClick={onSelect}
        className="btn-accent mt-4 w-full rounded-xl py-2.5 text-sm font-semibold"
      >
        Select
      </button>
    </div>
  );
}

function Perk({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <li className={cn("flex items-start gap-1.5", on ? "text-text" : "text-muted line-through")}>
      <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", on ? "text-emerald-500" : "text-muted")} />
      <span>{children}</span>
    </li>
  );
}
// eslint exhaustive: also export FarePerks-related helpers if needed
export type { FarePerks };
