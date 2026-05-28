"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Flight } from "@/lib/flights/types";
import type { FareOption } from "@/lib/flights/fares";
import { ReviewTrip } from "./steps/ReviewTrip";
import { BookingSidebar } from "./BookingSidebar";
import { StepHeader, type WizardStep } from "./StepHeader";

const STEPS: WizardStep[] = ["review", "travellers", "payment", "confirm"];

export function BookingWizard({
  flight,
  fareOption,
}: {
  flight: Flight;
  fareOption: FareOption;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const rawStep = sp.get("step");
  const step = (STEPS as string[]).includes(rawStep ?? "")
    ? (rawStep as WizardStep)
    : ("review" as WizardStep);
  const idx = STEPS.indexOf(step);

  function goto(next: WizardStep) {
    const params = new URLSearchParams(sp.toString());
    params.set("step", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <StepHeader current={step} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {step === "review" && <ReviewTrip flight={flight} fare={fareOption} />}
          {step === "travellers" && <Placeholder title="Travellers" />}
          {step === "payment" && <Placeholder title="Payment" />}
          {step === "confirm" && <Placeholder title="Review & book" />}
        </div>
        <BookingSidebar
          flight={flight}
          fare={fareOption}
          currentStep={step}
          onNext={() => goto(STEPS[Math.min(idx + 1, STEPS.length - 1)])}
        />
      </div>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
      <p className="font-semibold text-text">{title}</p>
      <p className="mt-2">This step lands in the next build chunk.</p>
    </div>
  );
}
