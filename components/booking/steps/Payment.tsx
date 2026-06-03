"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { PaymentInput } from "@/lib/booking/wizard-state";
import { COUNTRIES } from "@/lib/constants/countries";
import { formatCardNumber, isUnsupported } from "@/lib/booking/card";
import { AlertModal } from "@/components/ui/AlertModal";
import { BrandIcon, BrandIconStrip, detectBrand } from "../CardBrandIcons";

const field =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-sky-400";
const label = "mb-1 block text-xs font-medium text-muted";

function formatExpiry(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function Payment({
  value,
  onChange,
}: {
  value: PaymentInput;
  onChange: (value: PaymentInput) => void;
}) {
  const brand = detectBrand(value.cardNumber);
  const [showUnsupported, setShowUnsupported] = useState(false);

  function handleCardChange(raw: string) {
    const formatted = formatCardNumber(raw);
    onChange({ ...value, cardNumber: formatted });
    // Surface the rejection popup as soon as the BIN resolves to no accepted brand.
    if (isUnsupported(formatted)) setShowUnsupported(true);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">How would you like to pay?</h1>
        <p className="mt-2 flex items-center gap-2 text-xs text-amber-600">
          <ShieldCheck className="h-3.5 w-3.5" /> Payment is simulated — no real charge is made.
        </p>
      </div>

      <BrandIconStrip active={brand} />

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={label}>
              Name on card <span className="text-rose-500">*</span>
            </span>
            <input
              required
              className={field}
              value={value.nameOnCard}
              onChange={(e) => onChange({ ...value, nameOnCard: e.target.value })}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={label}>
              Debit/Credit card number <span className="text-rose-500">*</span>
            </span>
            <div className="relative">
              {brand && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <BrandIcon brand={brand} className="h-6 w-9 rounded" />
                </span>
              )}
              <input
                required
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                aria-invalid={isUnsupported(value.cardNumber)}
                className={`${field} ${brand ? "pl-16" : ""} ${
                  isUnsupported(value.cardNumber) ? "border-rose-400" : ""
                }`}
                value={value.cardNumber}
                onChange={(e) => handleCardChange(e.target.value)}
              />
            </div>
            {isUnsupported(value.cardNumber) && (
              <span className="mt-1 block text-xs font-medium text-rose-500">
                This card is not accepted on Travu. Please try another card.
              </span>
            )}
          </label>

          <label className="block">
            <span className={label}>
              Expiry date <span className="text-rose-500">*</span>
            </span>
            <input
              required
              inputMode="numeric"
              placeholder="MM/YY"
              className={field}
              value={value.expiry}
              onChange={(e) => onChange({ ...value, expiry: formatExpiry(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className={label}>
              Security code <span className="text-rose-500">*</span>
            </span>
            <input
              required
              inputMode="numeric"
              placeholder="123"
              maxLength={4}
              className={field}
              value={value.cvc}
              onChange={(e) => onChange({ ...value, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">Billing address</h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={label}>Country / Territory</span>
            <select
              className={field}
              value={value.billingCountry}
              onChange={(e) => onChange({ ...value, billingCountry: e.target.value })}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className={label}>
              Billing address 1 <span className="text-rose-500">*</span>
            </span>
            <input
              required
              placeholder="123 Main St"
              className={field}
              value={value.billingAddress1}
              onChange={(e) => onChange({ ...value, billingAddress1: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Billing address 2</span>
            <input
              placeholder="Suite 400, Apt 4B"
              className={field}
              value={value.billingAddress2}
              onChange={(e) => onChange({ ...value, billingAddress2: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={label}>
              Postal code <span className="text-rose-500">*</span>
            </span>
            <input
              required
              className={field}
              value={value.postalCode}
              onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={label}>
              City <span className="text-rose-500">*</span>
            </span>
            <input
              required
              className={field}
              value={value.city}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
            />
          </label>
        </div>
      </section>

      <AlertModal
        open={showUnsupported}
        title="Card not accepted"
        message="This card is not accepted on Travu, Please try another card"
        actionLabel="Try another card"
        onClose={() => setShowUnsupported(false)}
      />
    </div>
  );
}
