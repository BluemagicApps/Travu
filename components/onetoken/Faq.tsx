"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How can I join OneToken?",
    a: "Click here to join OneToken — it's free and easy to get started. Sign in or create a Travu account, then tap Join for free on this page.",
  },
  {
    q: "How does the OneToken rewards program work?",
    a: "OneToken is our rewards program where members enjoy Member Prices and earn OneTokenCash on eligible bookings. $1 in OneTokenCash equals $1 to use on Travel. As you book travel you collect trip elements that move you up the tiers — Blue, Silver, Gold, and Platinum.",
  },
  {
    q: "Does OneTokenCash expire?",
    a: "OneTokenCash earned on bookings won't expire if you make an eligible booking at least once within 18 months.",
  },
  {
    q: "Can I use OneTokenCash on flights?",
    a: "Yes. OneTokenCash can be redeemed at checkout on eligible flight and stay bookings, applied as an instant discount on the amount due.",
  },
  {
    q: "How do I reach tier status with OneToken?",
    a: "You earn one trip element for each hotel room night, vacation rental night, flight ticket, car rental day, cruise cabin night, and activity ticket you book. Collect 5 to unlock Silver, 15 for Gold, and 30 for Platinum.",
  },
  {
    q: "Is OneToken free?",
    a: "Yes — joining OneToken is completely free.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border rounded-2xl border border-border bg-surface">
      {FAQS.map((f, i) => (
        <div key={f.q}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="font-semibold">{f.q}</span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted transition ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && <p className="px-5 pb-5 text-sm text-muted">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
