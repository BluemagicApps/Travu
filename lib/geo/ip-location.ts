import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { haversineKm } from "@/lib/flights/geo";
import { countryToCurrency, isCurrency } from "@/lib/utils/currency";
import { LOCATION_COOKIE, type GeoLocation } from "./location";

export { LOCATION_COOKIE };
export type { GeoLocation };

// Preserve the app's historical defaults when geolocation is unavailable.
const FALLBACK: GeoLocation = {
  country: "NG",
  city: "Lagos",
  lat: 6.4531,
  lng: 3.3958,
  airport: "LOS",
  currency: "USD",
};

function isPrivateIp(ip: string): boolean {
  return (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("fc") ||
    ip.startsWith("fd")
  );
}

interface IpLookup {
  country: string;
  city: string;
  lat: number;
  lng: number;
  currency?: string;
}

/**
 * Look up the requester's coarse location from their IP via ipapi.co (https,
 * keyless free tier — set IPGEO_API_KEY later to swap in a paid provider).
 * Returns null on any failure so the caller can fall back gracefully.
 */
async function lookupIp(): Promise<IpLookup | null> {
  const h = await headers();
  const xff = h.get("x-forwarded-for") || h.get("x-real-ip") || "";
  const ip = xff.split(",")[0]?.trim() ?? "";
  // For local/private IPs, omit the IP so ipapi.co geolocates the request origin.
  const url = isPrivateIp(ip) ? "https://ipapi.co/json/" : `https://ipapi.co/${ip}/json/`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "travu/1.0 (+https://www.travunow.com)" },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const j = (await res.json()) as Record<string, unknown>;
    if (j.error) return null;
    const lat = Number(j.latitude);
    const lng = Number(j.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      country: String(j.country_code ?? j.country ?? ""),
      city: String(j.city ?? ""),
      lat,
      lng,
      currency: typeof j.currency === "string" ? j.currency : undefined,
    };
  } catch {
    return null;
  }
}

/** Nearest seeded airport IATA to a coordinate (haversine over the airports table). */
async function nearestAirport(lat: number, lng: number): Promise<string> {
  const airports = await prisma.airport.findMany({
    select: { iata: true, lat: true, lng: true },
  });
  let best = FALLBACK.airport;
  let bestDist = Infinity;
  for (const a of airports) {
    const d = haversineKm({ lat, lng }, { lat: a.lat, lng: a.lng });
    if (d < bestDist) {
      bestDist = d;
      best = a.iata;
    }
  }
  return best;
}

function parseCookie(raw: string): GeoLocation | null {
  for (const candidate of [raw, decodeURIComponent(raw)]) {
    try {
      const p = JSON.parse(candidate) as Partial<GeoLocation>;
      if (p && typeof p.airport === "string" && typeof p.lat === "number") {
        return p as GeoLocation;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

/**
 * Resolve the visitor's location for the current request. Memoised per request
 * via React cache(). Reads the `travu_loc` cookie first (set client-side by
 * OriginProvider so we only hit the IP API once per visitor); otherwise queries
 * the IP geo provider and maps to a nearest airport + default currency.
 */
export const getServerLocation = cache(async (): Promise<GeoLocation> => {
  const cookieVal = (await cookies()).get(LOCATION_COOKIE)?.value;
  if (cookieVal) {
    const cached = parseCookie(cookieVal);
    if (cached) return cached;
  }

  const ip = await lookupIp();
  if (!ip) return FALLBACK;

  const airport = await nearestAirport(ip.lat, ip.lng);
  const currency = isCurrency(ip.currency) ? ip.currency : countryToCurrency(ip.country);
  return {
    country: ip.country,
    city: ip.city,
    lat: ip.lat,
    lng: ip.lng,
    airport,
    currency,
  };
});
