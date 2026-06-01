"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BedDouble } from "lucide-react";

/**
 * Full-screen "completing your booking" screen. Shows for ~8–12s then routes to
 * the confirmation slip. Dedicated route so refreshing the slip never re-waits.
 */
export function WaitingOverlay({ bookingRef }: { bookingRef: string }) {
  const router = useRouter();

  useEffect(() => {
    // Re-arms on every mount (incl. React strict-mode double-invoke) so the
    // redirect always fires; router.replace to the same URL is idempotent.
    const delay = 8000 + Math.floor(Math.random() * 4000); // 8–12s
    const t = setTimeout(() => router.replace(`/stay-booking/${bookingRef}`), delay);
    return () => clearTimeout(t);
  }, [bookingRef, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 px-4">
      <div className="glass w-full max-w-md rounded-3xl p-10 text-center shadow-2xl">
        <div className="relative mx-auto grid h-16 w-16 place-items-center">
          <span
            className="absolute inset-0 rounded-full opacity-30 blur-xl"
            style={{ backgroundImage: "linear-gradient(to right, var(--accent-from), var(--accent-to))" }}
          />
          <span className="grid h-16 w-16 place-items-center rounded-full btn-accent">
            <BedDouble className="h-7 w-7 text-white" />
          </span>
        </div>
        <h1 className="mt-6 text-xl font-extrabold">Completing your booking</h1>
        <p className="mt-2 text-sm text-muted">
          Please wait while we confirm your reservation with the property. This may take a few moments.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-price">
          <Loader2 className="h-4 w-4 animate-spin" /> Securing your room…
        </div>
      </div>
    </div>
  );
}
