"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Flight } from "@/lib/flights/types";
import type { FareOption } from "@/lib/flights/fares";
import { ReviewTrip } from "./steps/ReviewTrip";
import { Travellers } from "./steps/Travellers";
import { Payment } from "./steps/Payment";
import { ReviewAndBook } from "./steps/ReviewAndBook";
import { BookingSidebar } from "./BookingSidebar";
import { StepHeader, type WizardStep } from "./StepHeader";
import {
  clearState,
  dobToIso,
  initialState,
  isContactComplete,
  isPaymentComplete,
  isTravellerComplete,
  loadState,
  saveState,
  storageKey,
  type WizardState,
} from "@/lib/booking/wizard-state";

const STEPS: WizardStep[] = ["review", "travellers", "payment", "confirm"];

export function BookingWizard({
  flight,
  fareOption,
  passengers,
}: {
  flight: Flight;
  fareOption: FareOption;
  passengers: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const rawStep = sp.get("step");
  const step = (STEPS as string[]).includes(rawStep ?? "")
    ? (rawStep as WizardStep)
    : ("review" as WizardStep);
  const idx = STEPS.indexOf(step);

  const key = storageKey(flight.id, fareOption.id);
  const [state, setState] = useState<WizardState>(() => initialState(passengers));
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState(loadState(key, passengers));
    setHydrated(true);
  }, [key, passengers]);

  useEffect(() => {
    if (hydrated) saveState(key, state);
  }, [key, state, hydrated]);

  const travellersOk = state.travellers.every(isTravellerComplete) && isContactComplete(state.contact);
  const paymentOk = isPaymentComplete(state.payment);

  function canAdvanceFrom(s: WizardStep): boolean {
    if (s === "review") return true;
    if (s === "travellers") return travellersOk;
    if (s === "payment") return paymentOk;
    return travellersOk && paymentOk;
  }

  function goto(next: WizardStep) {
    const params = new URLSearchParams(sp.toString());
    params.set("step", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  function nextStep() {
    if (!canAdvanceFrom(step)) return;
    if (idx < STEPS.length - 1) goto(STEPS[idx + 1]);
  }

  async function submit() {
    if (!canAdvanceFrom("confirm")) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          flightId: flight.id,
          fareName: fareOption.id,
          tripType: "one-way",
          passengers: state.travellers.map((t) => ({
            firstName: t.firstName.trim(),
            middleName: t.middleName.trim() || undefined,
            lastName: t.lastName.trim(),
            dateOfBirth: dobToIso(t),
            type: "ADULT",
            passportNumber: t.passportNumber.trim() || undefined,
            passportCountry: t.passportCountry || undefined,
          })),
          contactEmail: state.contact.email.trim(),
          contactPhone: state.contact.phone
            ? `+${state.contact.phoneCountry}${state.contact.phone.replace(/\D/g, "")}`
            : undefined,
          cardLast4: state.payment.cardNumber.replace(/\D/g, "").slice(-4),
        }),
      });
      if (res.status === 401) {
        router.push(
          `/login?callbackUrl=${encodeURIComponent(
            `/book/${flight.id}?fare=${fareOption.id}&step=confirm`,
          )}`,
        );
        return;
      }
      if (!res.ok) {
        setError("Could not complete the booking. Please try again.");
        setSubmitting(false);
        return;
      }
      const { bookingRef } = await res.json();
      clearState(key);
      router.push(`/booking/${bookingRef}`);
    } catch {
      setError("Network error — please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <StepHeader current={step} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {step === "review" && <ReviewTrip flight={flight} fare={fareOption} />}
          {step === "travellers" && (
            <Travellers
              travellers={state.travellers}
              contact={state.contact}
              onTravellerChange={(i, t) =>
                setState((s) => ({ ...s, travellers: s.travellers.map((x, j) => (j === i ? t : x)) }))
              }
              onContactChange={(c) => setState((s) => ({ ...s, contact: c }))}
            />
          )}
          {step === "payment" && (
            <Payment value={state.payment} onChange={(p) => setState((s) => ({ ...s, payment: p }))} />
          )}
          {step === "confirm" && (
            <ReviewAndBook
              flight={flight}
              fare={fareOption}
              state={state}
              submitting={submitting}
              error={error}
              onSubmit={submit}
            />
          )}
        </div>
        <BookingSidebar
          flight={flight}
          fare={fareOption}
          currentStep={step}
          passengers={passengers}
          onNext={step === "confirm" ? undefined : nextStep}
          ctaDisabled={!canAdvanceFrom(step)}
        />
      </div>
    </div>
  );
}
