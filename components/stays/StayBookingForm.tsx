"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock, ShieldCheck, BedDouble } from "lucide-react";
import type { Stay } from "@/lib/stays/types";
import type { ProtectionPlanId } from "@/lib/stays/pricing";
import { computeStayPrice } from "@/lib/stays/pricing";
import { Money } from "@/components/Money";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { rewardQuery, type BookingReward } from "@/lib/onetoken/reward-params";

const field =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-sky-400";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function cardBrandOf(digits: string): string | undefined {
  if (/^4/.test(digits)) return "visa";
  if (/^5[1-5]/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^6/.test(digits)) return "discover";
  return undefined;
}

export function StayBookingForm({ stay, rooms, onPlanChange }: { stay: Stay; rooms: number; onPlanChange?: (p: ProtectionPlanId) => void }) {
  const router = useRouter();
  const t = useTranslations("stays");
  const STAY_STEPS = [
    t("booking.steps.reviewing"),
    t("booking.steps.verifying"),
    t("booking.steps.confirming"),
    t("booking.steps.confirmed"),
  ];
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("US +1");
  const [phone, setPhone] = useState("");
  const [cardName, setCardName] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [billAddress, setBillAddress] = useState("");
  const [billCity, setBillCity] = useState("");
  const [billState, setBillState] = useState("");
  const [billZip, setBillZip] = useState("");
  const [billCountry, setBillCountry] = useState("United States of America");
  const [plan, setPlan] = useState<ProtectionPlanId>("NONE");
  const [requests, setRequests] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  // Captured from the POST response so onDone can pass the reward to the slip.
  const rewardRef = useRef<BookingReward | null>(null);

  const price = computeStayPrice(stay, rooms, plan);
  const protectPrice = computeStayPrice(stay, rooms, "TRAVU_PROTECT");

  function setPlanAndBubble(p: ProtectionPlanId) {
    setPlan(p);
    onPlanChange?.(p);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = card.replace(/\D/g, "");
    if (digits.length < 13) {
      setError(t("booking.errors.invalidCard"));
      return;
    }
    // Hand off to the staged BookingProgress overlay, which runs the POST below
    // in parallel with the animated steps (unified with the flights flow).
    setBooking(true);
  }

  // Performs the real reservation; resolves to the booking ref for the overlay.
  async function reserve(): Promise<string> {
    const digits = card.replace(/\D/g, "");
    const [mm, yy] = expiry.split("/").map((s) => s.trim());
    const res = await fetch("/api/stay-bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        stayId: stay.id,
        guests: [{ firstName, lastName, type: "ADULT" }],
        rooms,
        contactEmail: email || undefined,
        contactPhone: phone ? `${phoneCountry} ${phone}` : undefined,
        contactCountry: billCountry,
        billing: { name: cardName, address: billAddress, city: billCity, state: billState, zip: billZip, country: billCountry },
        protectionPlan: plan,
        cancellationTier: stay.refundable ? "Fully refundable" : "Non-refundable",
        cardLast4: digits.slice(-4),
        cardBrand: cardBrandOf(digits),
        expMonth: mm ? Number(mm) : undefined,
        expYear: yy ? 2000 + Number(yy) : undefined,
      }),
    });
    if (res.status === 401) {
      router.push(`/login?callbackUrl=/book/stay/${encodeURIComponent(stay.id)}`);
      throw new Error("auth"); // navigation already triggered; suppress the error toast
    }
    if (!res.ok) throw new Error("Could not complete the booking. Please try again.");
    const data = await res.json();
    rewardRef.current = { earned: data.earned, promotedTier: data.promotedTier };
    return data.bookingRef as string;
  }

  return (
    <>
    {booking && (
      <BookingProgress
        task={reserve}
        steps={STAY_STEPS}
        icon={BedDouble}
        onDone={(ref) => router.push(`/stay-booking/${ref}${rewardQuery(rewardRef.current)}`)}
        onError={(err) => {
          setBooking(false);
          if (!(err instanceof Error) || err.message !== "auth") {
            setError(t("booking.errors.bookingFailed"));
          }
        }}
      />
    )}
    <form onSubmit={submit} className="space-y-5">
      <Section title={t("booking.whoCheckingIn")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">{t("booking.firstName")}</span>
            <input required className={field} value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">{t("booking.lastName")}</span>
            <input required className={field} value={lastName} onChange={(e) => setLastName(e.target.value)} /></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-muted">{t("booking.emailAddress")}</span>
            <input type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">{t("booking.countryRegion")}</span>
            <select className={field} value={phoneCountry} onChange={(e) => setPhoneCountry(e.target.value)}>
              <option>US +1</option><option>UK +44</option><option>NG +234</option><option>AE +971</option><option>JP +81</option>
            </select></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">{t("booking.phoneNumber")}</span>
            <input inputMode="tel" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        </div>
      </Section>

      <Section title={t("booking.paymentDetails")}>
        <p className="-mt-1 mb-3 flex items-center gap-1.5 text-xs text-muted">
          <Lock className="h-3.5 w-3.5 text-price" /> {t("booking.secureTransaction")}
          <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium">{t("booking.simulatedNoCharge")}</span>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-muted">{t("booking.nameOnCard")}</span>
            <input required className={field} value={cardName} onChange={(e) => setCardName(e.target.value)} /></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-muted">{t("booking.cardNumber")}</span>
            <input required inputMode="numeric" placeholder="4242 4242 4242 4242" className={field} value={card} onChange={(e) => setCard(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">{t("booking.expiration")}</span>
            <input required placeholder={t("booking.expiryPlaceholder")} className={field} value={expiry} onChange={(e) => setExpiry(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">{t("booking.securityCode")}</span>
            <input required inputMode="numeric" placeholder="123" className={field} value={cvc} onChange={(e) => setCvc(e.target.value)} /></label>
        </div>
        <h3 className="mt-4 text-sm font-semibold">{t("booking.billingAddress")}</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-muted">{t("booking.countryRegion")}</span>
            <select className={field} value={billCountry} onChange={(e) => setBillCountry(e.target.value)}>
              <option>United States of America</option><option>United Kingdom</option><option>Nigeria</option><option>United Arab Emirates</option><option>Japan</option>
            </select></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-muted">{t("booking.address")}</span>
            <input className={field} value={billAddress} onChange={(e) => setBillAddress(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">{t("booking.city")}</span>
            <input className={field} value={billCity} onChange={(e) => setBillCity(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">{t("booking.stateProvince")}</span>
            <input className={field} value={billState} onChange={(e) => setBillState(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">{t("booking.zipPostal")}</span>
            <input className={field} value={billZip} onChange={(e) => setBillZip(e.target.value)} /></label>
        </div>
      </Section>

      <Section title={t("booking.protectYourStay")}>
        <div className="space-y-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${plan === "TRAVU_PROTECT" ? "border-price bg-price/5" : "border-border"}`}>
            <input type="radio" name="plan" className="mt-1" checked={plan === "TRAVU_PROTECT"} onChange={() => setPlanAndBubble("TRAVU_PROTECT")} />
            <span className="flex-1">
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold"><ShieldCheck className="h-4 w-4 text-price" /> {t("booking.travuProtect")}</span>
                <span className="font-semibold"><Money cents={protectPrice.protection} /></span>
              </span>
              <span className="mt-1 block text-xs text-muted">{t("booking.travuProtectDesc")}</span>
            </span>
          </label>
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${plan === "NONE" ? "border-price bg-price/5" : "border-border"}`}>
            <input type="radio" name="plan" className="mt-1" checked={plan === "NONE"} onChange={() => setPlanAndBubble("NONE")} />
            <span className="text-sm">{t("booking.noProtection")}</span>
          </label>
        </div>
      </Section>

      <Section title={t("booking.cancellationPolicy")}>
        <p className="text-sm text-muted">
          {stay.refundable
            ? t("booking.cancellationRefundable")
            : t("booking.cancellationNonRefundable")}
        </p>
      </Section>

      <Section title={t("booking.specialInstructions")}>
        <textarea className={`${field} min-h-20`} value={requests} onChange={(e) => setRequests(e.target.value)} placeholder={t("booking.specialInstructionsPlaceholder")} />
      </Section>

      <p className="text-xs text-muted">
        {t("booking.termsNotice")}
      </p>
      {error && <p className="text-sm text-rose-500">{error}</p>}

      <AnimatedSubmitButton loading={booking} loadingLabel={t("booking.processing")} className="py-3.5">
        <span>{t("booking.bookNow")} · <Money cents={price.total} /></span>
      </AnimatedSubmitButton>
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
        <Lock className="h-3 w-3" /> {t("booking.encryptionNotice")}
      </p>
    </form>
    </>
  );
}
