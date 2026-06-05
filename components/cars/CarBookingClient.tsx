"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Car, Check, ChevronLeft, ShieldCheck, Lock } from "lucide-react";
import type { Car as CarOffer } from "@/lib/cars/types";
import { computeCarPrice, type ProtectionPlanId } from "@/lib/cars/pricing";
import { Payment } from "@/components/booking/steps/Payment";
import { emptyPayment, isPaymentComplete, type PaymentInput } from "@/lib/booking/wizard-state";
import { detectBrand } from "@/lib/booking/card";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { CarBookingSummary } from "./CarBookingSummary";
import { Money } from "@/components/Money";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import { rewardQuery, type BookingReward } from "@/lib/onetoken/reward-params";

const field =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-sky-400";
const labelCls = "mb-1 block text-xs font-medium text-muted";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface DriverInput {
  firstName: string;
  lastName: string;
  age: string;
  email: string;
  phoneCountry: string;
  phone: string;
  flightNo: string;
  licenseNo: string;
}

const emptyDriver: DriverInput = {
  firstName: "",
  lastName: "",
  age: "",
  email: "",
  phoneCountry: "US +1",
  phone: "",
  flightNo: "",
  licenseNo: "",
};

export function CarBookingClient({ car }: { car: CarOffer }) {
  const t = useTranslations("cars");
  const router = useRouter();
  const CAR_STEPS = [
    t("progress.reviewing"),
    t("progress.verifyingDriver"),
    t("progress.confirmingCompany"),
    t("progress.confirmed"),
  ];
  const STEP_LABELS = [t("steps.review"), t("steps.driver"), t("steps.payment")];
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [plan, setPlan] = useState<ProtectionPlanId>("NONE");
  const [driver, setDriver] = useState<DriverInput>(emptyDriver);
  const [payment, setPayment] = useState<PaymentInput>({ ...emptyPayment });
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Captured from the POST response so onDone can pass the reward to the slip.
  const rewardRef = useRef<BookingReward | null>(null);

  const driverAge = driver.age ? Number(driver.age) : undefined;
  const price = computeCarPrice(car, plan, driverAge);
  const protectPrice = computeCarPrice(car, "TRAVU_PROTECT", driverAge);

  const driverComplete = Boolean(
    driver.firstName.trim() &&
      driver.lastName.trim() &&
      driverAge != null &&
      driverAge >= 18 &&
      EMAIL_RE.test(driver.email) &&
      driver.phone.trim().length >= 5,
  );
  const paymentComplete = isPaymentComplete(payment);

  function setDriverField<K extends keyof DriverInput>(k: K, v: DriverInput[K]) {
    setDriver((d) => ({ ...d, [k]: v }));
  }

  async function reserve(): Promise<string> {
    const digits = payment.cardNumber.replace(/\D/g, "");
    const [mm, yy] = payment.expiry.split("/").map((s) => s.trim());
    const phone = driver.phone ? `${driver.phoneCountry} ${driver.phone}` : undefined;
    const res = await fetch("/api/car-bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        carId: car.id,
        driver: {
          firstName: driver.firstName,
          lastName: driver.lastName,
          age: driverAge,
          email: driver.email || undefined,
          phone,
          flightNo: driver.flightNo || undefined,
          licenseNo: driver.licenseNo || undefined,
        },
        contactEmail: driver.email || undefined,
        contactPhone: phone,
        contactCountry: payment.billingCountry,
        billing: {
          name: payment.nameOnCard,
          address: [payment.billingAddress1, payment.billingAddress2].filter(Boolean).join(", "),
          city: payment.city,
          zip: payment.postalCode,
          country: payment.billingCountry,
        },
        protectionPlan: plan,
        cancellationTier: car.refundable ? "Free cancellation" : "Non-refundable",
        cardLast4: digits.slice(-4),
        cardBrand: detectBrand(payment.cardNumber) ?? undefined,
        expMonth: mm ? Number(mm) : undefined,
        expYear: yy ? 2000 + Number(yy) : undefined,
      }),
    });
    if (res.status === 401) {
      router.push(`/login?callbackUrl=/book/car/${encodeURIComponent(car.id)}`);
      throw new Error("auth");
    }
    if (!res.ok) throw new Error("Could not complete the reservation. Please try again.");
    const data = await res.json();
    rewardRef.current = { earned: data.earned, promotedTier: data.promotedTier };
    return data.bookingRef as string;
  }

  return (
    <>
      {booking && (
        <BookingProgress
          task={reserve}
          steps={CAR_STEPS}
          icon={Car}
          onDone={(ref) => router.push(`/car-booking/${ref}${rewardQuery(rewardRef.current)}`)}
          onError={(err) => {
            setBooking(false);
            if (!(err instanceof Error) || err.message !== "auth") {
              setError(t("booking.reservationError"));
            }
          }}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {/* Stepper */}
          <ol className="mb-5 flex items-center gap-2 text-xs font-medium">
            {STEP_LABELS.map((labelText, i) => {
              const n = (i + 1) as 1 | 2 | 3;
              const done = step > n;
              const current = step === n;
              return (
                <li key={labelText} className="flex items-center gap-2">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] ${
                      done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : current
                          ? "border-sky-400 text-price"
                          : "border-border text-muted"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : n}
                  </span>
                  <span className={current || done ? "text-text" : "text-muted"}>{labelText}</span>
                  {i < STEP_LABELS.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
                </li>
              );
            })}
          </ol>

          {/* Step 1 — Review + protection */}
          {step === 1 && (
            <div className="space-y-5">
              <h1 className="text-2xl font-extrabold">{t("booking.reviewYourCar")}</h1>
              <section className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={car.image} alt={car.exampleModel} className="h-24 w-32 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-price">{car.carClass}</p>
                    <h2 className="font-bold">{car.exampleModel}</h2>
                    <p className="mt-1 text-xs text-muted">
                      {car.transmission === "automatic" ? t("card.automatic") : t("card.manual")} · {t("card.seats", { count: car.seats })} · {t("card.bags", { count: car.bags })} · {t("card.mileageLabel", { mileage: car.mileage })}
                    </p>
                    <p className="mt-1 text-xs text-muted">{car.vendor} · {car.pickupType}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-surface p-4">
                <h2 className="font-semibold">{t("booking.protectYourRental")}</h2>
                <div className="mt-3 space-y-2">
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${plan === "TRAVU_PROTECT" ? "border-price bg-price/5" : "border-border"}`}>
                    <input type="radio" name="plan" className="mt-1" checked={plan === "TRAVU_PROTECT"} onChange={() => setPlan("TRAVU_PROTECT")} />
                    <span className="flex-1">
                      <span className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold"><ShieldCheck className="h-4 w-4 text-price" /> {t("booking.fullProtection")}</span>
                        <span className="font-semibold"><Money cents={protectPrice.protection} /></span>
                      </span>
                      <span className="mt-1 block text-xs text-muted">{t("booking.fullProtectionDesc")}</span>
                    </span>
                  </label>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${plan === "NONE" ? "border-price bg-price/5" : "border-border"}`}>
                    <input type="radio" name="plan" className="mt-1" checked={plan === "NONE"} onChange={() => setPlan("NONE")} />
                    <span className="text-sm">{t("booking.noProtection")}</span>
                  </label>
                </div>
              </section>

              <button type="button" onClick={() => setStep(2)} className="btn-accent w-full rounded-xl py-3.5 text-sm font-semibold">
                {t("booking.continueToDriver")}
              </button>
            </div>
          )}

          {/* Step 2 — Driver details */}
          {step === 2 && (
            <div className="space-y-5">
              <BackLink onClick={() => setStep(1)} label={t("booking.back")} />
              <h1 className="text-2xl font-extrabold">{t("booking.driverDetails")}</h1>
              <section className="rounded-2xl border border-border bg-surface p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block"><span className={labelCls}>{t("driver.firstName")} <span className="text-rose-500">*</span></span>
                    <input className={field} value={driver.firstName} onChange={(e) => setDriverField("firstName", e.target.value)} /></label>
                  <label className="block"><span className={labelCls}>{t("driver.lastName")} <span className="text-rose-500">*</span></span>
                    <input className={field} value={driver.lastName} onChange={(e) => setDriverField("lastName", e.target.value)} /></label>
                  <label className="block"><span className={labelCls}>{t("driver.age")} <span className="text-rose-500">*</span></span>
                    <input type="number" min={18} max={99} className={field} value={driver.age} onChange={(e) => setDriverField("age", e.target.value)} /></label>
                  <label className="block"><span className={labelCls}>{t("driver.licenseNo")}</span>
                    <input className={field} value={driver.licenseNo} onChange={(e) => setDriverField("licenseNo", e.target.value)} /></label>
                  <label className="block sm:col-span-2"><span className={labelCls}>{t("driver.email")} <span className="text-rose-500">*</span></span>
                    <input type="email" className={field} value={driver.email} onChange={(e) => setDriverField("email", e.target.value)} /></label>
                  <label className="block"><span className={labelCls}>{t("driver.countryCode")}</span>
                    <select className={field} value={driver.phoneCountry} onChange={(e) => setDriverField("phoneCountry", e.target.value)}>
                      <option>US +1</option><option>UK +44</option><option>NG +234</option><option>AE +971</option><option>JP +81</option>
                    </select></label>
                  <label className="block"><span className={labelCls}>{t("driver.phone")} <span className="text-rose-500">*</span></span>
                    <input inputMode="tel" className={field} value={driver.phone} onChange={(e) => setDriverField("phone", e.target.value)} /></label>
                  <label className="block sm:col-span-2"><span className={labelCls}>{t("driver.flightNo")}</span>
                    <input className={field} placeholder={t("driver.flightNoPlaceholder")} value={driver.flightNo} onChange={(e) => setDriverField("flightNo", e.target.value)} /></label>
                </div>
                {driverAge != null && driverAge < 25 && (
                  <p className="mt-3 text-xs text-amber-600">{t("driver.youngDriverNote")}</p>
                )}
              </section>
              <button
                type="button"
                disabled={!driverComplete}
                onClick={() => setStep(3)}
                className="btn-accent w-full rounded-xl py-3.5 text-sm font-semibold disabled:opacity-50"
              >
                {t("booking.continueToPayment")}
              </button>
            </div>
          )}

          {/* Step 3 — Payment */}
          {step === 3 && (
            <div className="space-y-5">
              <BackLink onClick={() => setStep(2)} label={t("booking.back")} />
              <Payment value={payment} onChange={setPayment} />
              {error && <p className="text-sm text-rose-500">{error}</p>}
              <AnimatedSubmitButton
                type="button"
                loading={booking}
                loadingLabel={t("booking.processing")}
                disabled={!paymentComplete}
                className="py-3.5"
                onClick={() => {
                  setError(null);
                  setBooking(true);
                }}
              >
                <span>{t("booking.reserveNow")} · <Money cents={price.total} /></span>
              </AnimatedSubmitButton>
              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
                <Lock className="h-3 w-3" /> {t("booking.secureNote")}
              </p>
            </div>
          )}
        </div>

        <CarBookingSummary car={car} plan={plan} driverAge={driverAge} />
      </div>
    </>
  );
}

function BackLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1 text-sm text-muted transition hover:text-text">
      <ChevronLeft className="h-4 w-4" /> {label}
    </button>
  );
}
