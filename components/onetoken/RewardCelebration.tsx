"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, TrendingUp } from "lucide-react";
import { Money } from "@/components/Money";
import { tierConfig } from "@/lib/onetoken/tiers";

/**
 * Celebration banner shown on a confirmation slip after a booking earns
 * OneTokenCash and/or promotes the member to a new tier. Driven by query params
 * the booking client appends to the confirmation URL (earned, promoted), so it
 * works without extra data fetching. Dismissible.
 */
export function RewardCelebration({ earned, promoted }: { earned?: number; promoted?: string | null }) {
  const [open, setOpen] = useState(true);
  const earnedCents = earned && earned > 0 ? earned : 0;
  if (!earnedCents && !promoted) return null;

  const tier = promoted ? tierConfig(promoted) : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="relative mb-4 overflow-hidden rounded-2xl border border-sky-400/40 p-4 shadow-lg"
          style={{
            backgroundImage:
              "linear-gradient(120deg, color-mix(in srgb, var(--accent-from) 14%, var(--surface)), color-mix(in srgb, var(--accent-to) 14%, var(--surface)))",
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Dismiss"
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-muted transition hover:bg-surface-2"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-price shadow">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              {earnedCents > 0 && (
                <p className="text-sm font-bold text-text">
                  You earned <Money cents={earnedCents} /> in OneTokenCash on this booking.
                </p>
              )}
              {tier && (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold" style={{ color: tier.color }}>
                  <TrendingUp className="h-4 w-4" />
                  Congratulations — you&apos;ve been promoted to {tier.name}!
                </p>
              )}
              <p className="mt-1 text-xs text-muted">
                It&apos;s in your OneToken balance, ready to spend on your next trip.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
