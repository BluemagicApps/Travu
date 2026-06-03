"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import type { Stay } from "@/lib/stays/types";
import type { ProtectionPlanId } from "@/lib/stays/pricing";
import { computeStayPrice } from "@/lib/stays/pricing";
import { Money } from "@/components/Money";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";

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
  const [loading, setLoading] = useState(false);

  const price = computeStayPrice(stay, rooms, plan);
  const protectPrice = computeStayPrice(stay, rooms, "TRAVU_PROTECT");

  function setPlanAndBubble(p: ProtectionPlanId) {
    setPlan(p);
    onPlanChange?.(p);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = card.replace(/\D/g, "");
    if (digits.length < 13) {
      setError("Enter a valid card number.");
      return;
    }
    const [mm, yy] = expiry.split("/").map((s) => s.trim());
    setLoading(true);
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
      return;
    }
    if (!res.ok) {
      setError("Could not complete the booking. Please try again.");
      setLoading(false);
      return;
    }
    const { bookingRef } = await res.json();
    router.push(`/stay-processing/${bookingRef}`);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Section title="Who's checking in?">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">First name</span>
            <input required className={field} value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">Last name</span>
            <input required className={field} value={lastName} onChange={(e) => setLastName(e.target.value)} /></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-muted">Email address</span>
            <input type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">Country / region</span>
            <select className={field} value={phoneCountry} onChange={(e) => setPhoneCountry(e.target.value)}>
              <option>US +1</option><option>UK +44</option><option>NG +234</option><option>AE +971</option><option>JP +81</option>
            </select></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">Phone number</span>
            <input inputMode="tel" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        </div>
      </Section>

      <Section title="Payment details">
        <p className="-mt-1 mb-3 flex items-center gap-1.5 text-xs text-muted">
          <Lock className="h-3.5 w-3.5 text-price" /> Safe, secure transaction. Your personal information is protected.
          <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium">simulated — no real charge</span>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-muted">Name on card</span>
            <input required className={field} value={cardName} onChange={(e) => setCardName(e.target.value)} /></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-muted">Card number</span>
            <input required inputMode="numeric" placeholder="4242 4242 4242 4242" className={field} value={card} onChange={(e) => setCard(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">Expiration</span>
            <input required placeholder="MM/YY" className={field} value={expiry} onChange={(e) => setExpiry(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">Security code</span>
            <input required inputMode="numeric" placeholder="123" className={field} value={cvc} onChange={(e) => setCvc(e.target.value)} /></label>
        </div>
        <h3 className="mt-4 text-sm font-semibold">Billing address</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-muted">Country / region</span>
            <select className={field} value={billCountry} onChange={(e) => setBillCountry(e.target.value)}>
              <option>United States of America</option><option>United Kingdom</option><option>Nigeria</option><option>United Arab Emirates</option><option>Japan</option>
            </select></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-muted">Address</span>
            <input className={field} value={billAddress} onChange={(e) => setBillAddress(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">City</span>
            <input className={field} value={billCity} onChange={(e) => setBillCity(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">State / province</span>
            <input className={field} value={billState} onChange={(e) => setBillState(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">ZIP / postal code</span>
            <input className={field} value={billZip} onChange={(e) => setBillZip(e.target.value)} /></label>
        </div>
      </Section>

      <Section title="Protect your stay">
        <div className="space-y-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${plan === "TRAVU_PROTECT" ? "border-price bg-price/5" : "border-border"}`}>
            <input type="radio" name="plan" className="mt-1" checked={plan === "TRAVU_PROTECT"} onChange={() => setPlanAndBubble("TRAVU_PROTECT")} />
            <span className="flex-1">
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold"><ShieldCheck className="h-4 w-4 text-price" /> Travu Protect</span>
                <span className="font-semibold"><Money cents={protectPrice.protection} /></span>
              </span>
              <span className="mt-1 block text-xs text-muted">Cancellation protection, trip interruption cover, and 24/7 emergency assistance for this stay.</span>
            </span>
          </label>
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${plan === "NONE" ? "border-price bg-price/5" : "border-border"}`}>
            <input type="radio" name="plan" className="mt-1" checked={plan === "NONE"} onChange={() => setPlanAndBubble("NONE")} />
            <span className="text-sm">No protection — I understand I may be responsible for cancellation fees.</span>
          </label>
        </div>
      </Section>

      <Section title="Cancellation policy">
        <p className="text-sm text-muted">
          {stay.refundable
            ? "Fully refundable if cancelled before 48 hours of check-in. After that, the first night is non-refundable."
            : "This rate is non-refundable. Changes or cancellations are not eligible for a refund."}
        </p>
      </Section>

      <Section title="Special check-in instructions">
        <textarea className={`${field} min-h-20`} value={requests} onChange={(e) => setRequests(e.target.value)} placeholder="Any requests for the host (optional)" />
      </Section>

      <p className="text-xs text-muted">
        By selecting Book now, I agree to the Travu Terms of Service and Privacy Statement, and confirm this is a simulated booking for demonstration.
      </p>
      {error && <p className="text-sm text-rose-500">{error}</p>}

      <AnimatedSubmitButton loading={loading} loadingLabel="Processing…" className="py-3.5">
        <span>Book now · <Money cents={price.total} /></span>
      </AnimatedSubmitButton>
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
        <Lock className="h-3 w-3" /> Our secure encryption protects your personal details at every step.
      </p>
    </form>
  );
}
