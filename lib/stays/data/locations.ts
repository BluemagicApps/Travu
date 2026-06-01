import { CITY_DATA } from "./cities";

export type LocationKind = "city" | "airport" | "area" | "landmark";

export interface LocationSuggestion {
  id: string;
  kind: LocationKind;
  primary: string; // bold first line, e.g. "London City Centre"
  secondary: string; // muted second line, e.g. "England, United Kingdom"
  /** The value to put in the search `destination` field (a curated city name). */
  cityKey: string;
}

/** Static city/area/landmark index built once from the curated city dataset. */
export const STATIC_LOCATION_INDEX: LocationSuggestion[] = (() => {
  const out: LocationSuggestion[] = [];
  for (const [key, c] of Object.entries(CITY_DATA)) {
    out.push({
      id: `city:${key}`,
      kind: "city",
      primary: c.city,
      secondary: "City",
      cityKey: c.city,
    });
    for (const n of c.neighbourhoods) {
      out.push({
        id: `area:${key}:${n}`,
        kind: "area",
        primary: `${n}, ${c.city}`,
        secondary: "Neighbourhood",
        cityKey: c.city,
      });
    }
    for (const l of c.landmarks) {
      out.push({
        id: `landmark:${key}:${l}`,
        kind: "landmark",
        primary: l,
        secondary: `Landmark · ${c.city}`,
        cityKey: c.city,
      });
    }
  }
  return out;
})();

const RANK: Record<LocationKind, number> = { city: 0, airport: 1, area: 2, landmark: 3 };

/**
 * Rank + filter location suggestions for a query. `extra` lets the API merge in
 * airport rows (which need a DB read) without coupling this module to Prisma.
 */
export function searchLocations(
  query: string,
  extra: LocationSuggestion[] = [],
  limit = 8,
): LocationSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const pool = [...STATIC_LOCATION_INDEX, ...extra];
  const scored = pool
    .map((loc) => {
      const hay = `${loc.primary} ${loc.secondary}`.toLowerCase();
      const idx = hay.indexOf(q);
      if (idx < 0) return null;
      // Prefer prefix matches, then kind, then string length.
      const starts = loc.primary.toLowerCase().startsWith(q) ? 0 : 1;
      return { loc, score: starts * 100 + RANK[loc.kind] * 10 + idx + loc.primary.length / 100 };
    })
    .filter((x): x is { loc: LocationSuggestion; score: number } => x !== null)
    .sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((x) => x.loc);
}
