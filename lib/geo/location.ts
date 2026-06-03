// Client-safe geo types & constants. Kept separate from ip-location.ts (which is
// server-only: it imports next/headers + prisma) so client components can import
// the shape and cookie name without pulling server code into the bundle.

import type { CurrencyCode } from "@/lib/utils/currency";

export const LOCATION_COOKIE = "travu_loc";

export interface GeoLocation {
  /** ISO-3166 alpha-2, e.g. "AE". */
  country: string;
  /** City name, e.g. "Dubai". May be empty when unknown. */
  city: string;
  lat: number;
  lng: number;
  /** Nearest airport IATA, e.g. "DXB" — used to pre-fill the "From" field. */
  airport: string;
  /** Default display currency for this location. */
  currency: CurrencyCode;
}
