import { Suspense } from "react";
import { TrackClient } from "@/components/booking/TrackClient";

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold">Track a booking</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your TRAVU booking reference (e.g. <span className="font-mono">TRV-AB12CD</span>) to
        see real-time status of your trip.
      </p>
      <Suspense fallback={<div className="mt-6 h-64" />}>
        <TrackClient />
      </Suspense>
    </div>
  );
}
