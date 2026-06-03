// LiteAPI stay id: encodes everything needed to re-fetch a single hotel's rate +
// detail when the search cache has expired (so detail/booking pages keep working).

export interface DecodedLiteId {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
}

const PREFIX = "liteapi_";

function enc(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}
function dec(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

export function isLiteId(id: string): boolean {
  return id.startsWith(PREFIX);
}

export function encodeLiteId(d: DecodedLiteId): string {
  return `${PREFIX}${enc(d.hotelId)}.${d.checkIn}.${d.checkOut}.${d.rooms}.${d.adults}`;
}

export function decodeLiteId(id: string): DecodedLiteId | null {
  if (!isLiteId(id)) return null;
  const parts = id.slice(PREFIX.length).split(".");
  if (parts.length !== 5) return null;
  const [hid, checkIn, checkOut, roomsStr, adultsStr] = parts;
  const rooms = Number(roomsStr);
  const adults = Number(adultsStr);
  if (!Number.isInteger(rooms) || rooms < 1 || !Number.isInteger(adults) || adults < 1) return null;
  try {
    return { hotelId: dec(hid), checkIn, checkOut, rooms, adults };
  } catch {
    return null;
  }
}
