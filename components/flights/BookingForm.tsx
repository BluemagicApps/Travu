"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import type { Flight } from "@/lib/flights/types";
import { Money } from "@/components/Money";
import { rewardQuery } from "@/lib/onetoken/reward-params";

export function BookingForm({ flight }: { flight: Flight }) {
  const t = useTranslations("flights");
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = card.replace(/\D/g, "");
    if (digits.length < 13) {
      setError(t("bookingForm.invalidCard"));
      return;
    }
    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        flightId: flight.id,
        passengers: [{ firstName, lastName, dateOfBirth: dob, type: "ADULT" }],
        cardLast4: digits.slice(-4),
      }),
    });
    if (res.status === 401) {
      router.push(`/login?callbackUrl=/book/${flight.id}`);
      return;
    }
    if (!res.ok) {
      setError(t("bookingForm.bookingFailed"));
      setLoading(false);
      return;
    }
    const data = await res.json();
    router.push(
      `/booking/${data.bookingRef}${rewardQuery({ earned: data.earned, promotedTier: data.promotedTier })}`,
    );
  }

  const field = "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-sky-400";

  return (
    <form onSubmit={submit} className="mt-4 space-y-5">
      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-semibold">{t("bookingForm.travellerDetails")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{t("bookingForm.firstName")}</span>
            <input required className={field} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{t("bookingForm.lastName")}</span>
            <input required className={field} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-muted">{t("bookingForm.dateOfBirth")}</span>
            <input type="date" required className={field} value={dob} onChange={(e) => setDob(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4 text-price" /> {t("bookingForm.payment")}
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
            {t("bookingForm.simulatedCharge")}
          </span>
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-muted">{t("bookingForm.cardNumber")}</span>
            <input
              required
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              className={field}
              value={card}
              onChange={(e) => setCard(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{t("bookingForm.expiry")}</span>
            <input required placeholder="MM/YY" className={field} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{t("bookingForm.cvc")}</span>
            <input required inputMode="numeric" placeholder="123" className={field} value={cvc} onChange={(e) => setCvc(e.target.value)} />
          </label>
        </div>
      </section>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="btn-accent w-full rounded-xl py-3.5 text-sm font-semibold disabled:opacity-60"
      >
        {loading ? (
          t("bookingForm.processing")
        ) : (
          <span>
            {t("bookingForm.pay")} <Money cents={flight.fare.total} /> {t("bookingForm.andConfirm")}
          </span>
        )}
      </button>
    </form>
  );
}
