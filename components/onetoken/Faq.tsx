"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

const FAQ_KEYS = ["join", "howItWorks", "expire", "flights", "tierStatus", "free"];

export function Faq() {
  const t = useTranslations("onetoken");
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border rounded-2xl border border-border bg-surface">
      {FAQ_KEYS.map((key, i) => (
        <div key={key}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="font-semibold">{t(`faq.${key}.q`)}</span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted transition ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && <p className="px-5 pb-5 text-sm text-muted">{t(`faq.${key}.a`)}</p>}
        </div>
      ))}
    </div>
  );
}
