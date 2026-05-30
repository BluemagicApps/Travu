"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { CurrencyProvider } from "./CurrencyProvider";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/utils/currency";

export function Providers({
  children,
  initialCurrency = DEFAULT_CURRENCY,
}: {
  children: ReactNode;
  initialCurrency?: CurrencyCode;
}) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CurrencyProvider initial={initialCurrency}>{children}</CurrencyProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
