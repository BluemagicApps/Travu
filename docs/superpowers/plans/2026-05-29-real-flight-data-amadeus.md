# Real Flight Data (Amadeus) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace TRAVU's synthetic flight search and tracking with real Amadeus Self-Service data, behind a provider seam that falls back to the existing generator when no API key is present, keeping booking simulated.

**Architecture:** A `FlightProvider` interface (`searchLeg` + `status`) with an `AmadeusProvider` (real) and `MockProvider` (current generator). `getProvider()` picks Amadeus when `AMADEUS_*` env vars exist, else Mock. Amadeus offers are ephemeral, so each mapped offer is persisted to a `CachedOffer` table at search time and resolved by id at booking time. `/track` uses `provider.status()` and falls back to the synthetic `statusFor()` when no live data exists.

**Tech Stack:** Next.js 16 (App Router, server components, route handlers), TypeScript, Prisma + Postgres (Neon), Vitest, Amadeus Self-Service REST APIs (OAuth2 client-credentials).

---

## File Structure

**New files**
- `lib/flights/amadeus/client.ts` — OAuth2 token cache + authenticated GET against `AMADEUS_BASE_URL`.
- `lib/flights/amadeus/mapOffers.ts` — pure: Amadeus Flight Offers JSON → `Flight[]`.
- `lib/flights/amadeus/mapStatus.ts` — pure: Amadeus Flight Status JSON → `ProviderStatus | null`.
- `lib/flights/amadeus/provider.ts` — `AmadeusProvider` implementing `FlightProvider`.
- `lib/flights/mock/provider.ts` — `MockProvider` wrapping the generator + `statusFor`.
- `lib/flights/provider.ts` — `FlightProvider` interface, `FlightLegParams`, `ProviderStatus`, `getProvider()`.
- `lib/flights/search.ts` — async `searchLeg(filter, leg)` using the provider + `applyFilters` + `sortFlights`; caches Amadeus offers.
- `lib/flights/offer-cache.ts` — read/write helpers for the `CachedOffer` table.
- `tests/unit/amadeus-map.test.ts` — mapper tests with fixtures.
- `tests/unit/fixtures/amadeus-offers.json`, `tests/unit/fixtures/amadeus-status.json` — saved API payloads.
- `tests/unit/provider.test.ts` — `getProvider()` selection.

**Modified files**
- `prisma/schema.prisma` — add `CachedOffer` model.
- `lib/flights/engine.ts` — extract `applyFilters`; keep `searchFlights` using it.
- `app/search/page.tsx` — await provider-backed `searchLeg`; guard price strip to mock.
- `app/api/bookings/route.ts` — resolve flight from `CachedOffer` before generator fallback.
- `app/api/track/route.ts` — use `provider.status()` with `statusFor` fallback.
- `.env` — add `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`, `AMADEUS_BASE_URL`.

---

## Task 1: Amadeus OAuth client with token caching

**Files:**
- Create: `lib/flights/amadeus/client.ts`
- Test: `tests/unit/amadeus-client.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/amadeus-client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { __resetTokenCache, getAccessToken } from "@/lib/flights/amadeus/client";

describe("amadeus client token cache", () => {
  beforeEach(() => {
    __resetTokenCache();
    process.env.AMADEUS_CLIENT_ID = "id";
    process.env.AMADEUS_CLIENT_SECRET = "secret";
    process.env.AMADEUS_BASE_URL = "https://test.api.amadeus.com";
  });

  it("fetches a token once and reuses it until near expiry", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "tok123", expires_in: 1800 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const a = await getAccessToken();
    const b = await getAccessToken();

    expect(a).toBe("tok123");
    expect(b).toBe("tok123");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/amadeus-client.test.ts`
Expected: FAIL — cannot import `getAccessToken` (module not found).

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/flights/amadeus/client.ts
let cachedToken: { value: string; expiresAt: number } | null = null;

export function __resetTokenCache(): void {
  cachedToken = null;
}

export function amadeusBaseUrl(): string {
  return process.env.AMADEUS_BASE_URL ?? "https://test.api.amadeus.com";
}

export function hasAmadeusKeys(): boolean {
  return Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
}

export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) return cachedToken.value;

  const res = await fetch(`${amadeusBaseUrl()}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.AMADEUS_CLIENT_ID ?? "",
      client_secret: process.env.AMADEUS_CLIENT_SECRET ?? "",
    }),
  });
  if (!res.ok) throw new Error(`amadeus_auth_failed_${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: now + json.expires_in * 1000 };
  return cachedToken.value;
}

/** Authenticated GET returning parsed JSON. Throws on non-2xx. */
export async function amadeusGet<T>(path: string, query: Record<string, string | number | boolean | undefined>): Promise<T> {
  const token = await getAccessToken();
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined) qs.set(k, String(v));
  const res = await fetch(`${amadeusBaseUrl()}${path}?${qs.toString()}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`amadeus_get_failed_${res.status}_${path}`);
  return (await res.json()) as T;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/amadeus-client.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/flights/amadeus/client.ts tests/unit/amadeus-client.test.ts
git commit -m "feat(amadeus): OAuth2 client with token caching"
```

---

## Task 2: Provider interface, types, and selection

**Files:**
- Create: `lib/flights/provider.ts`
- Create: `lib/flights/mock/provider.ts`
- Test: `tests/unit/provider.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/provider.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { getProvider } from "@/lib/flights/provider";

describe("getProvider", () => {
  beforeEach(() => {
    delete process.env.AMADEUS_CLIENT_ID;
    delete process.env.AMADEUS_CLIENT_SECRET;
  });

  it("returns the mock provider when no Amadeus keys are set", () => {
    expect(getProvider().kind).toBe("mock");
  });

  it("returns the amadeus provider when keys are set", () => {
    process.env.AMADEUS_CLIENT_ID = "id";
    process.env.AMADEUS_CLIENT_SECRET = "secret";
    expect(getProvider().kind).toBe("amadeus");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/provider.test.ts`
Expected: FAIL — module `@/lib/flights/provider` not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/flights/provider.ts
import type { Cabin, Flight } from "./types";
import type { StatusInfo } from "@/lib/booking/status";
import { hasAmadeusKeys } from "./amadeus/client";

export interface FlightLegParams {
  origin: string;
  dest: string;
  date: string;
  cabin: Cabin;
  passengers: number;
  nonStop?: boolean;
}

/** Normalized status from a provider; the route maps it onto StatusInfo. */
export interface ProviderStatus {
  status: StatusInfo;
  /** True when derived from real provider data (vs. synthetic fallback). */
  live: boolean;
}

export interface FlightProvider {
  kind: "amadeus" | "mock";
  /** Return raw (unfiltered) flights for one leg. */
  searchLeg(params: FlightLegParams): Promise<Flight[]>;
  /** Real flight status for a single flight, or null if unavailable. */
  status(carrierIata: string, flightNo: string, date: string): Promise<ProviderStatus | null>;
}

let cached: FlightProvider | null = null;
let cachedKind: "amadeus" | "mock" | null = null;

export function getProvider(): FlightProvider {
  const kind = hasAmadeusKeys() ? "amadeus" : "mock";
  if (cached && cachedKind === kind) return cached;
  cachedKind = kind;
  // Lazy require to avoid a static import cycle and to keep mock dependency-free.
  if (kind === "amadeus") {
    const { AmadeusProvider } = require("./amadeus/provider") as typeof import("./amadeus/provider");
    cached = new AmadeusProvider();
  } else {
    const { MockProvider } = require("./mock/provider") as typeof import("./mock/provider");
    cached = new MockProvider();
  }
  return cached;
}

/** Test helper to clear the memoized provider. */
export function __resetProvider(): void {
  cached = null;
  cachedKind = null;
}
```

```ts
// lib/flights/mock/provider.ts
import { loadDataset } from "../dataset";
import { generateFlights } from "../generator";
import { statusFor } from "@/lib/booking/status";
import type { FlightLegParams, FlightProvider, ProviderStatus } from "../provider";
import type { Flight } from "../types";

export class MockProvider implements FlightProvider {
  kind = "mock" as const;

  async searchLeg(params: FlightLegParams): Promise<Flight[]> {
    const ds = await loadDataset();
    return generateFlights(
      { origin: params.origin, dest: params.dest, date: params.date, cabin: params.cabin },
      ds,
    );
  }

  // Mock has no real status feed; the route falls back to statusFor on booked times.
  async status(): Promise<ProviderStatus | null> {
    return null;
  }
}

export { statusFor };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/provider.test.ts`
Expected: PASS (both cases).

> Note: `require(...)` inside `getProvider()` is intentional — it keeps the Amadeus module out of the mock/test path. Vitest supports CJS interop here.

- [ ] **Step 5: Commit**

```bash
git add lib/flights/provider.ts lib/flights/mock/provider.ts tests/unit/provider.test.ts
git commit -m "feat(flights): FlightProvider seam with mock fallback + selection"
```

---

## Task 3: Amadeus offer mapper (offers JSON → Flight[])

**Files:**
- Create: `lib/flights/amadeus/mapOffers.ts`
- Create: `tests/unit/fixtures/amadeus-offers.json`
- Test: `tests/unit/amadeus-map.test.ts` (offers section)

- [ ] **Step 1: Add the fixture (trimmed real-shaped Flight Offers Search response)**

```json
// tests/unit/fixtures/amadeus-offers.json
{
  "data": [
    {
      "id": "1",
      "itineraries": [
        {
          "duration": "PT8H5M",
          "segments": [
            {
              "departure": { "iataCode": "LOS", "at": "2026-09-15T22:25:00" },
              "arrival": { "iataCode": "DXB", "at": "2026-09-16T06:30:00" },
              "carrierCode": "EK",
              "number": "784",
              "duration": "PT8H5M",
              "numberOfStops": 0
            }
          ]
        }
      ],
      "price": { "currency": "USD", "base": "420.00", "grandTotal": "519.00" },
      "validatingAirlineCodes": ["EK"]
    }
  ],
  "dictionaries": { "carriers": { "EK": "EMIRATES" } }
}
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/unit/amadeus-map.test.ts
import { describe, it, expect } from "vitest";
import offers from "./fixtures/amadeus-offers.json";
import { mapOffers } from "@/lib/flights/amadeus/mapOffers";

describe("mapOffers", () => {
  it("maps an Amadeus offer into a Flight with cents fares and segments", () => {
    const flights = mapOffers(offers as never, "ECONOMY", "#0EA5E9");
    expect(flights).toHaveLength(1);
    const f = flights[0];
    expect(f.carrierIata).toBe("EK");
    expect(f.carrierName).toBe("EMIRATES");
    expect(f.stops).toBe(0);
    expect(f.departIso).toBe("2026-09-15T22:25:00");
    expect(f.arriveIso).toBe("2026-09-16T06:30:00");
    expect(f.fare.base).toBe(42000);
    expect(f.fare.total).toBe(51900);
    expect(f.fare.taxes).toBe(51900 - 42000);
    expect(f.segments[0].flightNo).toBe("784");
    expect(f.durationMin).toBe(8 * 60 + 5);
    expect(f.id).toMatch(/^amadeus:/);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/amadeus-map.test.ts`
Expected: FAIL — `mapOffers` not found.

- [ ] **Step 4: Write the implementation**

```ts
// lib/flights/amadeus/mapOffers.ts
import type { Cabin, Fare, Flight, Segment } from "../types";

interface AmSegment {
  departure: { iataCode: string; at: string };
  arrival: { iataCode: string; at: string };
  carrierCode: string;
  number: string;
  duration?: string;
  numberOfStops?: number;
}
interface AmOffer {
  id: string;
  itineraries: { duration?: string; segments: AmSegment[] }[];
  price: { currency: string; base?: string; total?: string; grandTotal?: string };
  validatingAirlineCodes?: string[];
}
export interface AmOffersResponse {
  data: AmOffer[];
  dictionaries?: { carriers?: Record<string, string> };
}

/** ISO-8601 duration "PT8H5M" -> minutes. */
export function isoDurationToMinutes(iso: string | undefined): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
}

function cents(value: string | undefined): number {
  return Math.round(Number(value ?? 0) * 100);
}

let counter = 0;
function offerId(): string {
  // App-side ephemeral id; uniqueness within a search is all that's required.
  counter = (counter + 1) % 1_000_000;
  return `amadeus:${counter.toString(36)}:${String(performance.now()).replace(".", "")}`;
}

export function mapOffers(resp: AmOffersResponse, cabin: Cabin, brandColor: string): Flight[] {
  const carriers = resp.dictionaries?.carriers ?? {};
  const out: Flight[] = [];
  for (const offer of resp.data ?? []) {
    const itin = offer.itineraries?.[0];
    if (!itin || itin.segments.length === 0) continue;

    const segments: Segment[] = itin.segments.map((s) => ({
      airlineIata: s.carrierCode,
      airlineName: carriers[s.carrierCode] ?? s.carrierCode,
      flightNo: s.number,
      originIata: s.departure.iataCode,
      destIata: s.arrival.iataCode,
      departIso: s.departure.at,
      arriveIso: s.arrival.at,
      durationMin: isoDurationToMinutes(s.duration),
    }));

    const first = segments[0];
    const last = segments[segments.length - 1];
    const carrierIata = offer.validatingAirlineCodes?.[0] ?? first.airlineIata;
    const base = cents(offer.price.base);
    const total = cents(offer.price.grandTotal ?? offer.price.total);
    const fare: Fare = { base, taxes: Math.max(0, total - base), fees: 0, total };

    out.push({
      id: offerId(),
      carrierIata,
      carrierName: carriers[carrierIata] ?? carrierIata,
      carrierColor: brandColor,
      flightNo: first.flightNo,
      cabin,
      stops: segments.length - 1,
      durationMin: isoDurationToMinutes(itin.duration) || segments.reduce((n, s) => n + s.durationMin, 0),
      departIso: first.departIso,
      arriveIso: last.arriveIso,
      seatsLeft: 9,
      fare,
      segments,
    });
  }
  return out;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/amadeus-map.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/flights/amadeus/mapOffers.ts tests/unit/fixtures/amadeus-offers.json tests/unit/amadeus-map.test.ts
git commit -m "feat(amadeus): map Flight Offers Search into Flight type"
```

---

## Task 4: Amadeus status mapper (status JSON → ProviderStatus)

**Files:**
- Create: `lib/flights/amadeus/mapStatus.ts`
- Create: `tests/unit/fixtures/amadeus-status.json`
- Test: extend `tests/unit/amadeus-map.test.ts`

- [ ] **Step 1: Add the fixture (trimmed On-Demand Flight Status response)**

```json
// tests/unit/fixtures/amadeus-status.json
{
  "data": [
    {
      "flightDesignator": { "carrierCode": "EK", "flightNumber": 784 },
      "flightPoints": [
        { "iataCode": "LOS", "departure": { "timings": [{ "qualifier": "STD", "value": "2026-09-15T22:25:00+01:00" }] } },
        { "iataCode": "DXB", "arrival": { "timings": [{ "qualifier": "STA", "value": "2026-09-16T06:30:00+04:00" }] } }
      ]
    }
  ]
}
```

- [ ] **Step 2: Write the failing test (append to amadeus-map.test.ts)**

```ts
import status from "./fixtures/amadeus-status.json";
import { mapStatus } from "@/lib/flights/amadeus/mapStatus";

describe("mapStatus", () => {
  it("derives a phase from the real scheduled times", () => {
    // A fixed 'now' before scheduled departure → 'confirmed' or 'check_in_open'.
    const res = mapStatus(status as never, new Date("2026-09-10T00:00:00Z"));
    expect(res).not.toBeNull();
    expect(res!.live).toBe(true);
    expect(["confirmed", "check_in_open"]).toContain(res!.status.phase);
  });

  it("returns null when there is no data", () => {
    expect(mapStatus({ data: [] } as never, new Date())).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/amadeus-map.test.ts`
Expected: FAIL — `mapStatus` not found.

- [ ] **Step 4: Write the implementation**

```ts
// lib/flights/amadeus/mapStatus.ts
import { statusFor } from "@/lib/booking/status";
import type { ProviderStatus } from "../provider";

interface Timing { qualifier: string; value: string }
interface FlightPoint {
  iataCode: string;
  departure?: { timings: Timing[] };
  arrival?: { timings: Timing[] };
}
interface StatusDatum { flightPoints: FlightPoint[] }
export interface AmStatusResponse { data: StatusDatum[] }

function firstTiming(points: FlightPoint[], key: "departure" | "arrival"): string | undefined {
  for (const p of points) {
    const t = p[key]?.timings?.[0]?.value;
    if (t) return t;
  }
  return undefined;
}

/** Map real scheduled times to a phase via the same time-based logic used for mock. */
export function mapStatus(resp: AmStatusResponse, now: Date = new Date()): ProviderStatus | null {
  const datum = resp.data?.[0];
  if (!datum) return null;
  const dep = firstTiming(datum.flightPoints, "departure");
  const arr = firstTiming(datum.flightPoints, "arrival");
  if (!dep || !arr) return null;
  return { status: statusFor(dep, arr, now), live: true };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/amadeus-map.test.ts`
Expected: PASS (all offers + status cases).

- [ ] **Step 6: Commit**

```bash
git add lib/flights/amadeus/mapStatus.ts tests/unit/fixtures/amadeus-status.json tests/unit/amadeus-map.test.ts
git commit -m "feat(amadeus): map On-Demand Flight Status into status phases"
```

---

## Task 5: AmadeusProvider (search + status)

**Files:**
- Create: `lib/flights/amadeus/provider.ts`

> No new unit test (it composes already-tested client + mappers and does network I/O). It is exercised manually in Task 11 and indirectly via `getProvider()`.

- [ ] **Step 1: Write the implementation**

```ts
// lib/flights/amadeus/provider.ts
import { amadeusGet } from "./client";
import { mapOffers, type AmOffersResponse } from "./mapOffers";
import { mapStatus, type AmStatusResponse } from "./mapStatus";
import type { FlightLegParams, FlightProvider, ProviderStatus } from "../provider";
import type { Cabin, Flight } from "../types";

const TRAVEL_CLASS: Record<Cabin, string> = {
  ECONOMY: "ECONOMY",
  PREMIUM: "PREMIUM_ECONOMY",
  BUSINESS: "BUSINESS",
};

// Neutral brand color for real carriers (the UI tolerates a single accent).
const DEFAULT_BRAND = "#0EA5E9";

export class AmadeusProvider implements FlightProvider {
  kind = "amadeus" as const;

  async searchLeg(params: FlightLegParams): Promise<Flight[]> {
    const resp = await amadeusGet<AmOffersResponse>("/v2/shopping/flight-offers", {
      originLocationCode: params.origin,
      destinationLocationCode: params.dest,
      departureDate: params.date,
      adults: params.passengers,
      travelClass: TRAVEL_CLASS[params.cabin],
      nonStop: params.nonStop ? true : undefined,
      currencyCode: "USD",
      max: 30,
    });
    return mapOffers(resp, params.cabin, DEFAULT_BRAND);
  }

  async status(carrierIata: string, flightNo: string, date: string): Promise<ProviderStatus | null> {
    try {
      const resp = await amadeusGet<AmStatusResponse>("/v2/schedule/flights", {
        carrierCode: carrierIata,
        flightNumber: flightNo,
        scheduledDepartureDate: date,
      });
      return mapStatus(resp);
    } catch {
      return null; // status feed is best-effort
    }
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/flights/amadeus/provider.ts
git commit -m "feat(amadeus): AmadeusProvider search + status"
```

---

## Task 6: CachedOffer model + offer-cache helpers

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `lib/flights/offer-cache.ts`

- [ ] **Step 1: Add the Prisma model**

Append to `prisma/schema.prisma`:

```prisma
model CachedOffer {
  id        String   @id
  payload   Json
  createdAt DateTime @default(now())

  @@index([createdAt])
}
```

- [ ] **Step 2: Create the migration**

Run: `npx prisma migrate dev --name cached_offer`
Expected: a new migration is created and applied; Prisma Client regenerates. Output ends with "Your database is now in sync with your schema."

- [ ] **Step 3: Write the cache helpers**

```ts
// lib/flights/offer-cache.ts
import { prisma } from "@/lib/db/prisma";
import type { Flight } from "./types";

const TTL_MS = 30 * 60 * 1000;

export async function cacheOffers(flights: Flight[]): Promise<void> {
  if (flights.length === 0) return;
  await prisma.$transaction(
    flights.map((f) =>
      prisma.cachedOffer.upsert({
        where: { id: f.id },
        create: { id: f.id, payload: f as unknown as object },
        update: { payload: f as unknown as object },
      }),
    ),
  );
}

export async function getCachedOffer(id: string): Promise<Flight | null> {
  const row = await prisma.cachedOffer.findUnique({ where: { id } });
  if (!row) return null;
  if (Date.now() - row.createdAt.getTime() > TTL_MS) return null;
  return row.payload as unknown as Flight;
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (Prisma Client now knows `cachedOffer`).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations lib/flights/offer-cache.ts
git commit -m "feat(flights): CachedOffer table + offer cache helpers"
```

---

## Task 7: Extract `applyFilters` from the engine

**Files:**
- Modify: `lib/flights/engine.ts`
- Test: `tests/unit/engine.test.ts` (existing — must still pass)

- [ ] **Step 1: Refactor `searchFlights` to use a pure `applyFilters`**

Replace the body of `searchFlights` in `lib/flights/engine.ts` (lines 24-58) so the filter block becomes a reusable export. The new file content for those functions:

```ts
// lib/flights/engine.ts  (replace from `export function searchFlights` downward)
export function applyFilters(flights: Flight[], filter: FlightFilter): Flight[] {
  let out = flights;
  if (typeof filter.maxStops === "number") out = out.filter((f) => f.stops <= filter.maxStops!);
  if (typeof filter.maxBudget === "number") out = out.filter((f) => f.fare.total <= filter.maxBudget!);
  if (typeof filter.departAfter === "number") out = out.filter((f) => hourOf(f.departIso) >= filter.departAfter!);
  if (typeof filter.departBefore === "number") out = out.filter((f) => hourOf(f.departIso) < filter.departBefore!);
  if (typeof filter.arriveBefore === "number") out = out.filter((f) => hourOf(f.arriveIso) < filter.arriveBefore!);
  if (filter.airlines && filter.airlines.length > 0) {
    const set = new Set(filter.airlines.map((a) => a.toUpperCase()));
    out = out.filter((f) => set.has(f.carrierIata));
  }
  return sortFlights(out, filter.sort);
}

export function searchFlights(filter: FlightFilter, ds: Dataset): SearchResult {
  if (!filter.origin || !filter.destination || !filter.departDate) return { flights: [], count: 0 };
  const flights = generateFlights(
    { origin: filter.origin.toUpperCase(), dest: filter.destination.toUpperCase(), date: filter.departDate, cabin: filter.cabin },
    ds,
  );
  const filtered = applyFilters(flights, filter);
  return { flights: filtered, count: filtered.length };
}
```

- [ ] **Step 2: Run the existing engine tests to verify no regression**

Run: `npx vitest run tests/unit/engine.test.ts`
Expected: PASS (behavior unchanged).

- [ ] **Step 3: Commit**

```bash
git add lib/flights/engine.ts
git commit -m "refactor(flights): extract applyFilters for provider reuse"
```

---

## Task 8: Provider-backed leg search + wire the search page

**Files:**
- Create: `lib/flights/search.ts`
- Modify: `app/search/page.tsx`

- [ ] **Step 1: Write `searchLeg` (provider + filter + cache)**

```ts
// lib/flights/search.ts
import type { FlightFilter, Leg } from "@/lib/ai/schema";
import { applyFilters, type SearchResult } from "./engine";
import { getProvider } from "./provider";
import { cacheOffers } from "./offer-cache";

export async function searchLeg(filter: FlightFilter, leg: Leg): Promise<SearchResult> {
  const provider = getProvider();
  const flights = await provider.searchLeg({
    origin: leg.origin,
    dest: leg.dest,
    date: leg.date,
    cabin: filter.cabin,
    passengers: filter.passengers,
    nonStop: filter.maxStops === 0,
  });
  if (provider.kind === "amadeus") await cacheOffers(flights);
  const filtered = applyFilters(flights, filter);
  return { flights: filtered, count: filtered.length };
}

export function providerKind(): "amadeus" | "mock" {
  return getProvider().kind;
}
```

- [ ] **Step 2: Update the search page to await the provider and guard the price strip**

In `app/search/page.tsx`:

Replace the imports of `loadDataset`/`searchFlights`/engine usage with the new async path. Specifically:

1. Replace `import { searchFlights, type SearchResult } from "@/lib/flights/engine";` with:
   ```ts
   import type { SearchResult } from "@/lib/flights/engine";
   import { searchLeg as providerSearchLeg, providerKind } from "@/lib/flights/search";
   ```
2. Replace `searchLeg` (lines 48-53) and `buildLegSections` (lines 70-85) with async versions:
   ```ts
   async function searchLeg(filter: ParsedFilter, leg: Leg): Promise<SearchResult> {
     return providerSearchLeg({ ...filter, origin: leg.origin, destination: leg.dest, departDate: leg.date }, leg);
   }

   async function buildLegSections(filter: ParsedFilter, legs: Leg[]): Promise<LegSection[]> {
     if (filter.tripType === "return" && legs.length >= 2) {
       return [
         { title: "Departing flights", leg: legs[0], result: await searchLeg(filter, legs[0]) },
         { title: "Returning flights", leg: legs[1], result: await searchLeg(filter, legs[1]) },
       ];
     }
     if (filter.tripType === "multi-city") {
       const out: LegSection[] = [];
       for (let idx = 0; idx < legs.length; idx++) {
         out.push({ title: `Leg ${idx + 1}: ${legs[idx].origin} → ${legs[idx].dest}`, leg: legs[idx], result: await searchLeg(filter, legs[idx]) });
       }
       return out;
     }
     return [{ title: "Departing flights", leg: legs[0], result: await searchLeg(filter, legs[0]) }];
   }
   ```
3. Replace `computePriceStrip` (lines 55-62) to be mock-only (the strip does 7 searches — too costly against a real API):
   ```ts
   async function computePriceStrip(filter: ParsedFilter, leg: Leg): Promise<StripDay[] | null> {
     if (providerKind() !== "mock") return null; // skip 7 live calls
     const days = await Promise.all(
       [-3, -2, -1, 0, 1, 2, 3].map(async (d) => {
         const date = addDays(leg.date, d);
         const r = await searchLeg({ ...filter, airlines: undefined }, { ...leg, date });
         const min = r.flights.reduce((m, f) => Math.min(m, f.fare.total), Number.POSITIVE_INFINITY);
         return { date, minPrice: Number.isFinite(min) ? min : null, isActive: d === 0 };
       }),
     );
     return days;
   }
   ```
4. In the `SearchPage` body: remove `const ds = await loadDataset();`, and update the calls:
   ```ts
   const legs = legsFromFilter(filter);
   const sections = legs.length > 0 ? await buildLegSections(filter, legs) : [];
   const mainSection = sections[0];
   const facets = mainSection ? computeFacets(mainSection.result.flights) : { stopCounts: { 0: 0, 1: 0 }, airlines: [] };
   const strip = filter.tripType === "one-way" && mainSection ? await computePriceStrip(filter, mainSection.leg) : null;
   ```
   Also remove the now-unused `loadDataset` and `Dataset` imports.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Verify search renders keyless (mock path)**

Run: `npm run dev` then in another terminal:
`curl -s "http://localhost:3000/search?tripType=one-way&origin=LOS&destination=DXB&departDate=2026-09-15&passengers=1&cabin=ECONOMY" | grep -c "flights found"`
Expected: `1` (results render via the mock provider, unchanged behavior).

- [ ] **Step 5: Commit**

```bash
git add lib/flights/search.ts app/search/page.tsx
git commit -m "feat(search): provider-backed leg search; price strip mock-only"
```

---

## Task 9: Resolve booking flight from CachedOffer

**Files:**
- Modify: `app/api/bookings/route.ts`

- [ ] **Step 1: Resolve the offer from cache before the generator fallback**

In `app/api/bookings/route.ts`, replace the flight-resolution block (currently lines 40-48: `decodeId` + `generateFlights` + `.find`) with:

```ts
import { getCachedOffer } from "@/lib/flights/offer-cache";
// ... existing imports stay ...

// Resolve the selected flight: cached Amadeus offer first, else regenerate (mock).
let flight = await getCachedOffer(parsed.data.flightId);
if (!flight) {
  const decoded = decodeId(parsed.data.flightId);
  if (!decoded) return NextResponse.json({ error: "bad_flight_id" }, { status: 400 });
  const ds = await loadDataset();
  flight =
    generateFlights(
      { origin: decoded.origin, dest: decoded.dest, date: decoded.date, cabin: decoded.cabin },
      ds,
    ).find((f) => f.id === parsed.data.flightId) ?? null;
}
if (!flight) return NextResponse.json({ error: "flight_unavailable" }, { status: 404 });
```

Everything downstream (fares via `fareOptionsFor(flight)`, snapshot, payment) is unchanged.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify the keyless booking e2e still passes**

Run: `npx playwright test --project=desktop tests/e2e/booking-flow.spec.ts`
Expected: golden-path test PASS (mock path: id decodes + regenerates as before).

> If signup races hydration locally, the failure is in signup setup, not this change (see prior session notes); re-run once warm.

- [ ] **Step 4: Commit**

```bash
git add app/api/bookings/route.ts
git commit -m "feat(booking): resolve flight from cached Amadeus offer, generator fallback"
```

---

## Task 10: Real flight status on /track

**Files:**
- Modify: `app/api/track/route.ts`

- [ ] **Step 1: Use the provider's status with a synthetic fallback**

In `app/api/track/route.ts`, after loading `flight` (line 23) replace the status line (line 24) with:

```ts
import { getProvider } from "@/lib/flights/provider";
// ... existing imports stay ...

const seg = flight.segments[0];
const provider = getProvider();
const live = await provider.status(seg.airlineIata, seg.flightNo, flight.departIso.slice(0, 10));
const status = live?.status ?? statusFor(flight.departIso, flight.arriveIso);
```

Then add `live: Boolean(live?.live)` to the JSON response object so the UI can label real vs. estimated status:

```ts
return NextResponse.json({
  ref: booking.bookingRef,
  tripType: booking.tripType,
  fareName: booking.fareName,
  status,
  live: Boolean(live?.live),
  flight: { /* unchanged */ },
  travellers: booking.passengers.map((p) => p.firstName),
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify keyless track still works (synthetic fallback)**

With the dev server running and an existing booking ref (create one via the app), POST to the route:
`curl -s -X POST http://localhost:3000/api/track -H "content-type: application/json" -d '{"ref":"TRV-XXXXXX"}' | grep -o '"phase":"[a-z_]*"'`
Expected: a phase string (e.g. `"phase":"confirmed"`) — mock provider returns null status → synthetic fallback used.

- [ ] **Step 4: Commit**

```bash
git add app/api/track/route.ts
git commit -m "feat(track): real flight status via provider with synthetic fallback"
```

---

## Task 11: Env config + full verification

**Files:**
- Modify: `.env` (local only — gitignored)

- [ ] **Step 1: Add Amadeus env vars (keyless-safe)**

Append to `.env` (leave blank until you have Test keys — blank keys keep the mock provider active):

```
AMADEUS_CLIENT_ID=""
AMADEUS_CLIENT_SECRET=""
AMADEUS_BASE_URL="https://test.api.amadeus.com"
```

- [ ] **Step 2: Full keyless test sweep**

Run: `npm run test`
Expected: all unit tests pass, including `amadeus-client`, `amadeus-map`, and `provider`.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification WITH Amadeus Test keys**

1. Get free Test keys at https://developers.amadeus.com (no card), paste into `.env`, restart `npm run dev`.
2. Search a Test-supported route (Amadeus Test data is best for major hubs, e.g. `MAD→LON`, `NYC→LAX`, `LON→PAR`):
   `curl -s "http://localhost:3000/search?tripType=one-way&origin=MAD&destination=LON&departDate=<future-date>&passengers=1&cabin=ECONOMY" | grep -c "flights found"`
   Expected: `1`, with real carrier names in the rendered results.
3. Complete a booking through the UI; confirm the A4 slip + PDF show the real carrier/flight numbers.
4. `/track` the new booking ref; confirm a phase is returned (real schedule when available, else synthetic).

- [ ] **Step 4: Commit (env example only — do NOT commit real keys)**

If the repo keeps an example env file, document the three vars there. Do not commit `.env`.

```bash
# Only if an .env.example exists:
git add .env.example
git commit -m "docs: document Amadeus env vars"
```

---

## Self-Review notes (addressed)

- **Spec coverage:** provider seam (T2), mock fallback (T2/T6-mock), Amadeus client (T1), search mapping (T3), status mapping (T4), AmadeusProvider (T5), CachedOffer + ephemeral-offer fix (T6/T9), search wiring (T8), booking resolution (T9), real status on /track (T10), env/test→prod (T11). All covered.
- **Booking stays simulated:** no Flight Offers Price/Create Orders calls anywhere. ✔
- **Tests keep passing keyless:** mock provider is the default with no keys; engine/booking behavior preserved (T7 refactor is behavior-neutral; T9 falls back to decodeId). ✔
- **Type consistency:** `FlightLegParams`, `ProviderStatus`, `FlightProvider.kind`, `mapOffers`, `mapStatus`, `getCachedOffer`, `cacheOffers`, `applyFilters`, `searchLeg` names are used identically across tasks. ✔
- **Price strip** intentionally disabled for the Amadeus provider (avoids 7 live calls); logged behavior, not silent. ✔
