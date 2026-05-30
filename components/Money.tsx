"use client";

import { useCurrency } from "@/components/layout/CurrencyProvider";
import { formatMoney } from "@/lib/utils/currency";

/** Renders a USD-cents amount in the user's selected display currency. */
export function Money({ cents }: { cents: number }) {
  const { currency } = useCurrency();
  return <>{formatMoney(cents, currency)}</>;
}
