"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Faq } from "@/lib/stays/types";

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (faqs.length === 0) return null;
  return (
    <section className="border-t border-border py-6">
      <h2 className="text-lg font-bold">Frequently asked questions</h2>
      <div className="mt-3 divide-y divide-border rounded-2xl border border-border">
        {faqs.map((f, i) => (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium"
            >
              {f.q}
              <ChevronDown className={`h-4 w-4 shrink-0 transition ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <p className="px-4 pb-4 text-sm text-muted">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
