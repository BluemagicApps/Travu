import { getCityData } from "@/lib/stays/data/cities";

// ISO-3166 alpha-2 country code for each supported stay city (LiteAPI's
// /data/hotels needs cityName + countryCode). Keyed by lowercased city name.
const CITY_COUNTRY: Record<string, string> = {
  // Europe
  barcelona: "ES", madrid: "ES", paris: "FR", rome: "IT", london: "GB",
  amsterdam: "NL", lisbon: "PT", berlin: "DE", munich: "DE", istanbul: "TR",
  // Asia / ME
  tokyo: "JP", osaka: "JP", dubai: "AE", "abu dhabi": "AE", bangkok: "TH",
  singapore: "SG", "kuala lumpur": "MY", penang: "MY", langkawi: "MY",
  kathmandu: "NP", pokhara: "NP", "phnom penh": "KH", "siem reap": "KH",
  delhi: "IN", mumbai: "IN",
  // United States
  "new york": "US", "los angeles": "US", "las vegas": "US", miami: "US",
  orlando: "US", "san francisco": "US", chicago: "US", denver: "US",
  seattle: "US", boston: "US", washington: "US",
};

export interface LitePlace {
  cityName: string;
  countryCode: string;
  lat: number;
  lng: number;
}

/**
 * Resolve a free-text destination to a LiteAPI place (city + country + coords).
 * Returns null when we don't have a confident country mapping, so the caller can
 * fall back to the mock provider.
 */
export function resolveLitePlace(destination: string): LitePlace | null {
  const key = destination.trim().toLowerCase();
  const countryCode = CITY_COUNTRY[key];
  const city = getCityData(destination);
  if (!countryCode || !city) return null;
  return {
    cityName: city.city,
    countryCode,
    lat: city.coords.lat,
    lng: city.coords.lng,
  };
}
