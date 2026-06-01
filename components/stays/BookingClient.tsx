"use client";

import { useState } from "react";
import type { Stay } from "@/lib/stays/types";
import type { ProtectionPlanId } from "@/lib/stays/pricing";
import { StayBookingForm } from "./StayBookingForm";
import { StayBookingSummary } from "./StayBookingSummary";

/** Holds the protection-plan choice so form + summary totals stay in sync. */
export function BookingClient({ stay, rooms }: { stay: Stay; rooms: number }) {
  const [plan, setPlan] = useState<ProtectionPlanId>("NONE");
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="mb-4 text-xl font-extrabold">Complete your booking</h1>
        <StayBookingForm stay={stay} rooms={rooms} onPlanChange={setPlan} />
      </div>
      <StayBookingSummary stay={stay} rooms={rooms} plan={plan} />
    </div>
  );
}
