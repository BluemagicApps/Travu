"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/utils/currency";

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
});

export function CurrencyProvider({
  initial,
  children,
}: {
  initial: CurrencyCode;
  children: ReactNode;
}) {
  const router = useRouter();
  const [currency, setCurrencyState] = useState<CurrencyCode>(initial);

  const setCurrency = useCallback(
    (c: CurrencyCode) => {
      setCurrencyState(c);
      // Persist for SSR (server components read this cookie) and re-render server content.
      document.cookie = `${CURRENCY_COOKIE}=${c}; path=/; max-age=${60 * 60 * 24 * 365}`;
      router.refresh();
    },
    [router],
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}
