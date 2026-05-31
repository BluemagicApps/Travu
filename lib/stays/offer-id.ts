export interface DecodedStayId {
  destination: string;
  checkIn: string;
  checkOut: string;
  index: number;
}

const PREFIX = "mock_stay_";

/** base64url so the destination string (may contain spaces) is URL-safe. */
function b64urlEncode(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}
function b64urlDecode(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

export function encodeStayId(d: DecodedStayId): string {
  const payload = `${b64urlEncode(d.destination)}.${d.checkIn}.${d.checkOut}.${d.index}`;
  return `${PREFIX}${payload}`;
}

export function decodeStayId(id: string): DecodedStayId | null {
  if (!id.startsWith(PREFIX)) return null;
  const parts = id.slice(PREFIX.length).split(".");
  if (parts.length !== 4) return null;
  const [dest, checkIn, checkOut, idx] = parts;
  const index = Number(idx);
  if (!Number.isInteger(index) || index < 0) return null;
  try {
    return { destination: b64urlDecode(dest), checkIn, checkOut, index };
  } catch {
    return null;
  }
}
