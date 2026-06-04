"use client";

import { AnimatePresence, motion } from "framer-motion";

/**
 * Thin indeterminate blue progress bar shown under a search card while a search
 * is in flight (driven by the search form's useTransition `pending`). Reused by
 * every search across the app (flights, stays, cars).
 */
export function SearchProgressBar({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          role="progressbar"
          aria-label="Searching"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 4 }}
          exit={{ opacity: 0, height: 0 }}
          className="relative mt-3 w-full overflow-hidden rounded-full bg-sky-100 dark:bg-sky-950/40"
        >
          <motion.span
            className="absolute inset-y-0 w-1/3 rounded-full"
            style={{
              backgroundImage: "linear-gradient(90deg, transparent, #0ea5e9, #2563eb, transparent)",
            }}
            initial={{ x: "-120%" }}
            animate={{ x: "360%" }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
