"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Money } from "@/components/Money";

/** Navbar pill promoting OneToken — shows the member's OneTokenCash balance when
 *  enrolled, otherwise a "OneToken" prompt. Links to the program page. */
export function OneTokenBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/onetoken/me")
      .then((r) => r.json())
      .then((d) => {
        if (active && d?.membership) setBalance(d.membership.pointsBalance as number);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <Link
      href="/onetoken"
      className="hidden items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-xs font-semibold text-price transition hover:border-sky-400 sm:flex"
      aria-label="OneToken rewards"
    >
      <Sparkles className="h-3.5 w-3.5" />
      {balance != null ? <Money cents={balance} /> : "OneToken"}
    </Link>
  );
}
