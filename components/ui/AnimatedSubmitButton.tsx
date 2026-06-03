"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Primary action button with a tactile press animation and a "working" state
 * (spinner + sweeping shimmer). Reused across flights and stays so every primary
 * button feels responsive when clicked.
 */
export function AnimatedSubmitButton({
  children,
  loadingLabel = "Working…",
  loading = false,
  type = "submit",
  onClick,
  disabled = false,
  className,
}: {
  children: ReactNode;
  loadingLabel?: ReactNode;
  loading?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.97 }}
      whileHover={loading ? undefined : { scale: 1.01 }}
      className={cn(
        "btn-accent relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-90",
        className,
      )}
    >
      {loading && (
        <motion.span
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
          }}
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
        />
      )}
      <span className="relative flex items-center gap-2">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {loadingLabel}
          </>
        ) : (
          children
        )}
      </span>
    </motion.button>
  );
}
