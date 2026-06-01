import type { Stay } from "./types";

/** "Highlights for your N-night trip" heading helper. */
export function highlightsHeading(nights: number): string {
  return `Highlights for your ${nights}-night trip`;
}

/** Short label for a property type, e.g. "Entire apartment" / "Hotel". */
export function propertyTypeLabel(stay: Stay): string {
  switch (stay.propertyType) {
    case "apartment":
      return "Entire apartment";
    case "home":
      return "Entire home";
    case "resort":
      return "Resort";
    default:
      return "Hotel";
  }
}

/** Build an OpenStreetMap embed URL with a marker (keyless, interactive). */
export function osmEmbedUrl(lat: number, lng: number, spanDeg = 0.04): string {
  const left = (lng - spanDeg).toFixed(5);
  const right = (lng + spanDeg).toFixed(5);
  const top = (lat + spanDeg).toFixed(5);
  const bottom = (lat - spanDeg).toFixed(5);
  const bbox = `${left}%2C${bottom}%2C${right}%2C${top}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

/** Link to the full OSM map for "View in a larger map". */
export function osmLinkUrl(lat: number, lng: number, zoom = 14): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
}
