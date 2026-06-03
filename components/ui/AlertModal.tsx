"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Lightweight dismissible alert modal rendered on the same page (no navigation).
 * Used e.g. to tell the user a card brand isn't accepted.
 */
export function AlertModal({
  open,
  title,
  message,
  actionLabel = "OK",
  onClose,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  actionLabel?: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            initial={{ scale: 0.92, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <h2 className="text-lg font-extrabold">{title}</h2>
              <p className="text-sm text-muted">{message}</p>
              <button
                type="button"
                onClick={onClose}
                className="btn-accent mt-2 w-full rounded-xl py-2.5 text-sm font-semibold"
              >
                {actionLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
