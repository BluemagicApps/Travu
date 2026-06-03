"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { CurrencyProvider } from "./CurrencyProvider";
import { OriginProvider } from "./OriginProvider";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/utils/currency";
import type { GeoLocation } from "@/lib/geo/location";

export function Providers({
  children,
  initialCurrency = DEFAULT_CURRENCY,
  location,
  hadCurrencyCookie = true,
}: {
  children: ReactNode;
  initialCurrency?: CurrencyCode;
  location: GeoLocation;
  hadCurrencyCookie?: boolean;
}) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CurrencyProvider initial={initialCurrency}>
          <OriginProvider location={location} hadCurrencyCookie={hadCurrencyCookie}>
            {children}
          </OriginProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
