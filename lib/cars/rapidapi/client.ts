// Thin RapidAPI client for a car-rental endpoint (default: Booking.com car
// rentals via booking-com15). Live only when CARS_RAPIDAPI_KEY is set; until
// then getCarProvider() serves the mock generator. The exact request/response
// shape is finalized by probing with a real key (see rapidapi/map.ts).

const DEFAULT_HOST = "booking-com15.p.rapidapi.com";

export function carRapidApiEnabled(): boolean {
  return Boolean(process.env.CARS_RAPIDAPI_KEY);
}

export function carRapidApiHost(): string {
  return process.env.CARS_RAPIDAPI_HOST || DEFAULT_HOST;
}

function carRapidApiKey(): string {
  return process.env.CARS_RAPIDAPI_KEY ?? "";
}

/** GET a RapidAPI path with the host/key headers; returns parsed JSON. */
export async function rapidApiGet<T>(path: string, query: Record<string, string | number | undefined>): Promise<T> {
  const host = carRapidApiHost();
  const url = new URL(`https://${host}${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": carRapidApiKey(),
      "x-rapidapi-host": host,
    },
    // Reference data; let Next cache briefly within a request burst.
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`rapidapi_http_${res.status}`);
  return (await res.json()) as T;
}
