"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Flight } from "@/lib/flights/types";
import type { FareOption } from "@/lib/flights/fares";
import { ReviewTrip } from "./steps/ReviewTrip";
import { Travellers } from "./steps/Travellers";
import { Payment } from "./steps/Payment";
import { detectBrand } from "./CardBrandIcons";
import { getCountry } from "@/lib/constants/countries";
import { ReviewAndBook } from "./steps/ReviewAndBook";
import { BookingSidebar } from "./BookingSidebar";
import { BookingProgress } from "./BookingProgress";
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
  const t = useTranslations("flights");
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
  const [showProgress, setShowProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oneTokenBalance, setOneTokenBalance] = useState(0);
  const [redeem, setRedeem] = useState(false);

  const loginUrl = `/login?callbackUrl=${encodeURIComponent(
    `/book/${flight.id}?fare=${fareOption.id}&step=confirm`,
  )}`;

  // Load the member's OneTokenCash balance to offer it at checkout.
  useEffect(() => {
    let active = true;
    fetch("/api/onetoken/me")
      .then((r) => r.json())
      .then((d) => {
        if (active && d?.membership) setOneTokenBalance(d.membership.pointsBalance as number);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const grossTotal = fareOption.fare.total * passengers;
  const redeemApplied = redeem ? Math.min(oneTokenBalance, grossTotal) : 0;

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

  // The actual booking call. Runs in parallel with the progress overlay's
  // animation; resolves to the booking reference or throws.
  async function bookingTask(): Promise<string> {
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
          ? `+${getCountry(state.contact.phoneCountry)?.dial ?? ""}${state.contact.phone.replace(/\D/g, "")}`
          : undefined,
        cardLast4: state.payment.cardNumber.replace(/\D/g, "").slice(-4),
        cardBrand: detectBrand(state.payment.cardNumber) ?? undefined,
        redeemCents: redeemApplied,
      }),
    });
    if (res.status === 401) throw new Error("login");
    if (!res.ok) throw new Error(t("bookingForm.bookingFailed"));
    const { bookingRef } = (await res.json()) as { bookingRef: string };
    return bookingRef;
  }

  function submit() {
    if (!canAdvanceFrom("confirm")) return;
    setError(null);
    setSubmitting(true);
    setShowProgress(true); // overlay drives the booking via bookingTask()
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
              oneTokenBalance={oneTokenBalance}
              redeem={redeem}
              redeemApplied={redeemApplied}
              onToggleRedeem={() => setRedeem((v) => !v)}
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

      {showProgress && (
        <BookingProgress
          task={bookingTask}
          onDone={(bookingRef) => {
            clearState(key);
            router.push(`/booking/${bookingRef}`);
          }}
          onError={(err) => {
            setShowProgress(false);
            setSubmitting(false);
            if (err instanceof Error && err.message === "login") {
              router.push(loginUrl);
            } else {
              setError(err instanceof Error ? err.message : t("bookingForm.networkError"));
            }
          }}
        />
      )}
    </div>
  );
}
