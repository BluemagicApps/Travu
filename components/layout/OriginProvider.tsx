"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { CURRENCY_COOKIE } from "@/lib/utils/currency";
import { LOCATION_COOKIE, type GeoLocation } from "@/lib/geo/location";

interface OriginContextValue {
  /** Nearest-airport IATA derived from the visitor's IP (default "From"). */
  origin: string;
  /** Detected city name (used in home-page headings). */
  city: string;
  /** ISO alpha-2 country code. */
  country: string;
}

const OriginContext = createContext<OriginContextValue>({
  origin: "LOS",
  city: "Lagos",
  country: "NG",
});

export function OriginProvider({
  location,
  hadCurrencyCookie,
  children,
}: {
  location: GeoLocation;
  /** Whether the user has already explicitly chosen a currency. */
  hadCurrencyCookie: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    // Persist the resolved location so subsequent SSRs read the cookie instead
    // of re-hitting the IP API on every render.
    if (!document.cookie.includes(`${LOCATION_COOKIE}=`)) {
      const payload = encodeURIComponent(JSON.stringify(location));
      document.cookie = `${LOCATION_COOKIE}=${payload}; path=/; max-age=${60 * 60 * 24 * 30}`;
    }
    // Seed the display currency from the IP location, but never override a choice.
    if (!hadCurrencyCookie) {
      document.cookie = `${CURRENCY_COOKIE}=${location.currency}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  }, [location, hadCurrencyCookie]);

  return (
    <OriginContext.Provider
      value={{ origin: location.airport, city: location.city, country: location.country }}
    >
      {children}
    </OriginContext.Provider>
  );
}

export function useOrigin(): OriginContextValue {
  return useContext(OriginContext);
}
