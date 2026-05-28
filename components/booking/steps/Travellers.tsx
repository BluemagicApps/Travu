"use client";

import type { ContactInput, TravellerInput } from "@/lib/booking/wizard-state";

const COUNTRIES = [
  { code: "NG", label: "Nigeria", dial: "234" },
  { code: "GB", label: "United Kingdom", dial: "44" },
  { code: "US", label: "United States", dial: "1" },
  { code: "FR", label: "France", dial: "33" },
  { code: "DE", label: "Germany", dial: "49" },
  { code: "AE", label: "United Arab Emirates", dial: "971" },
  { code: "GH", label: "Ghana", dial: "233" },
  { code: "KE", label: "Kenya", dial: "254" },
  { code: "ZA", label: "South Africa", dial: "27" },
  { code: "IN", label: "India", dial: "91" },
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const field =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-sky-400";
const label = "mb-1 block text-xs font-medium text-muted";

export function Travellers({
  travellers,
  contact,
  onTravellerChange,
  onContactChange,
}: {
  travellers: TravellerInput[];
  contact: ContactInput;
  onTravellerChange: (idx: number, value: TravellerInput) => void;
  onContactChange: (value: ContactInput) => void;
}) {
  const years = Array.from({ length: 100 }, (_, i) => 2026 - i);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Secure booking — only takes a few minutes</h1>
        <p className="mt-1 text-sm text-muted">
          Traveller names must match government-issued photo ID exactly.{" "}
          <span className="text-rose-500">*</span> Required
        </p>
      </div>

      {travellers.map((t, idx) => (
        <section key={idx} className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">
            Traveller {idx + 1} of {travellers.length}
          </h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className={label}>
                First name <span className="text-rose-500">*</span>
              </span>
              <input
                required
                className={field}
                value={t.firstName}
                onChange={(e) => onTravellerChange(idx, { ...t, firstName: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={label}>Middle name</span>
              <input
                className={field}
                value={t.middleName}
                onChange={(e) => onTravellerChange(idx, { ...t, middleName: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={label}>
                Surname <span className="text-rose-500">*</span>
              </span>
              <input
                required
                className={field}
                value={t.lastName}
                onChange={(e) => onTravellerChange(idx, { ...t, lastName: e.target.value })}
              />
            </label>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={label}>
                Passport number <span className="text-rose-500">*</span>
              </span>
              <input
                required
                className={field}
                value={t.passportNumber}
                onChange={(e) => onTravellerChange(idx, { ...t, passportNumber: e.target.value.toUpperCase() })}
              />
            </label>
            <label className="block">
              <span className={label}>Passport country</span>
              <select
                className={field}
                value={t.passportCountry}
                onChange={(e) => onTravellerChange(idx, { ...t, passportCountry: e.target.value })}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4">
            <span className={label}>
              Date of birth <span className="text-rose-500">*</span>
            </span>
            <div className="grid grid-cols-3 gap-3">
              <select
                aria-label="Date of birth day"
                className={field}
                value={t.dobDay}
                onChange={(e) => onTravellerChange(idx, { ...t, dobDay: e.target.value })}
              >
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                aria-label="Date of birth month"
                className={field}
                value={t.dobMonth}
                onChange={(e) => onTravellerChange(idx, { ...t, dobMonth: e.target.value })}
              >
                <option value="">Month</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={String(i + 1)}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                aria-label="Date of birth year"
                className={field}
                value={t.dobYear}
                onChange={(e) => onTravellerChange(idx, { ...t, dobYear: e.target.value })}
              >
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">Contact details</h2>
        <p className="mt-1 text-xs text-muted">
          We will send your e-ticket and any updates to this email.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_2fr]">
          <label className="block sm:col-span-3">
            <span className={label}>
              Email address <span className="text-rose-500">*</span>
            </span>
            <input
              type="email"
              required
              className={field}
              value={contact.email}
              onChange={(e) => onContactChange({ ...contact, email: e.target.value })}
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={contact.emailConfirmed}
                onChange={(e) => onContactChange({ ...contact, emailConfirmed: e.target.checked })}
              />
              Send me trip updates and travel deals.
            </label>
          </label>

          <label className="block">
            <span className={label}>
              Country code <span className="text-rose-500">*</span>
            </span>
            <select
              className={field}
              value={contact.phoneCountry}
              onChange={(e) => onContactChange({ ...contact, phoneCountry: e.target.value })}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.dial}>
                  {c.label} +{c.dial}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>
              Phone number <span className="text-rose-500">*</span>
            </span>
            <input
              required
              className={field}
              value={contact.phone}
              onChange={(e) => onContactChange({ ...contact, phone: e.target.value })}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
