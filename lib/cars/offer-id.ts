export interface DecodedCarId {
  pickup: string;
  dropoff: string;
  pickupDate: string;
  returnDate: string;
  index: number;
}

const PREFIX = "mock_car_";

/** base64url so location strings (may contain spaces) are URL-safe and dot-free. */
function b64urlEncode(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}
function b64urlDecode(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

export function encodeCarId(d: DecodedCarId): string {
  const payload = `${b64urlEncode(d.pickup)}.${b64urlEncode(d.dropoff)}.${d.pickupDate}.${d.returnDate}.${d.index}`;
  return `${PREFIX}${payload}`;
}

export function decodeCarId(id: string): DecodedCarId | null {
  if (!id.startsWith(PREFIX)) return null;
  const parts = id.slice(PREFIX.length).split(".");
  if (parts.length !== 5) return null;
  const [pickup, dropoff, pickupDate, returnDate, idx] = parts;
  const index = Number(idx);
  if (!Number.isInteger(index) || index < 0) return null;
  try {
    return {
      pickup: b64urlDecode(pickup),
      dropoff: b64urlDecode(dropoff),
      pickupDate,
      returnDate,
      index,
    };
  } catch {
    return null;
  }
}
