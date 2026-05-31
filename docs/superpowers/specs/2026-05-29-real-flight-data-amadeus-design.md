# TRAVU — Real flight data via Amadeus (search + live status)

**Date:** 2026-05-29
**Status:** Approved design, pending implementation plan

## Context

TRAVU's flights are currently 100% synthetic. `lib/flights/generator.ts` deterministically
invents flights/fares/times from a seeded list of airports, airlines, and routes in Postgres;
flight `id`s encode origin/dest/date/cabin (`encodeId`/`decodeId`); `/api/bookings` regenerates
the flight from its id to validate before storing a `flightSnapshot`; payment is simulated; and
`/track` shows a synthetic status timeline.

The owner wants the app to feel real: search real airlines/destinations with many options, and
show real live flight status on the tracking page. This spec covers replacing the synthetic
**search** and **flight status** with real data while keeping everything else (booking wizard,
confirmation slip/PDF, auth) intact.

## Decisions (confirmed)

- **No real money.** Booking stays simulated — no real payments, ticketing, PCI, or airline
  accreditation. We do NOT call Amadeus pricing/order APIs.
- **Scope = real search + real flight status** on `/track` in v1.
- **Provider = Amadeus for Developers, Self-Service APIs** (one provider covers both
  Flight Offers Search and On-Demand Flight Status, with a free tier).
- **Environment:** build against the free **Test** environment; keys and base URL are env vars so
  flipping to **Production** (full data, lots of options) is a config change, not a code change.
- **Integration approach = provider seam with mock fallback** (Approach A): real Amadeus when keys
  are present, current generator as fallback otherwise. Keeps keyless dev and existing tests working.

## Goals

- Search (from the form and the AI flow) returns real, mapped airline offers with many options.
- `/track` shows real departure/arrival/delay status for a booked flight when available.
- The app still runs fully with **no Amadeus keys** (mock provider), so dev, CI, and the existing
  test suite keep passing, and the demo never breaks when the quota is exhausted.

## Non-goals (v1 / YAGNI)

- Real payment, ticket issuance, refunds (booking stays simulated).
- Flight Offers Price / Create Orders, seat maps, ancillaries, baggage selection, multi-currency.
- Multi-city search (stays mock or out of scope for v1). One-way + return only.
- Status for connecting segments beyond the primary segment.

## Architecture — provider seam

A small interface decouples the app from the data source:

```ts
// lib/flights/provider.ts
export interface FlightSearchParams {
  origin: string; destination: string; departDate: string;
  returnDate?: string; passengers: number; cabin: Cabin;
  maxStops?: number; sort?: "best" | "price" | "duration";
}
export interface FlightStatusResult { /* mapped status for the /track timeline */ }

export interface FlightProvider {
  search(params: FlightSearchParams): Promise<Flight[]>;
  status(carrierIata: string, flightNo: string, date: string): Promise<FlightStatusResult | null>;
}

export function getProvider(): FlightProvider; // Amadeus if AMADEUS_* keys present, else Mock
```

`getProvider()` selects `AmadeusProvider` when `AMADEUS_CLIENT_ID`/`AMADEUS_CLIENT_SECRET` are set,
otherwise `MockProvider`. This mirrors the existing AI fallback (`conversation.ts` checks for a key).

## Components

**New**
- `lib/flights/provider.ts` — `FlightProvider` interface, `FlightSearchParams`, `getProvider()`.
- `lib/flights/amadeus/client.ts` — OAuth2 client-credentials token fetch with in-memory caching
  (token ~30 min), `GET` helper, base URL from `AMADEUS_BASE_URL`
  (`https://test.api.amadeus.com` or `https://api.amadeus.com`).
- `lib/flights/amadeus/provider.ts` — implements `FlightProvider`:
  - `search()` → `GET /v2/shopping/flight-offers` → map each offer into the existing
    `Flight`/`Segment`/`Fare` types.
  - `status()` → `GET /v2/schedule/flights` (On-Demand Flight Status) → map to `FlightStatusResult`.
- `lib/flights/amadeus/map.ts` — pure mappers (Amadeus JSON → `Flight`; status JSON →
  `FlightStatusResult`). Pure functions for unit testing with fixtures.
- `lib/flights/mock/provider.ts` — wraps the existing generator + a synthetic status builder to
  satisfy `FlightProvider` (preserves current behavior as the fallback).
- `lib/flights/status.ts` — `FlightStatusResult` type + the synthetic status builder used by the
  mock provider and as the `/track` fallback.
- `app/api/flight-search/route.ts` — accepts search params, calls `getProvider().search()`, writes
  each returned offer to `CachedOffer`, returns the `Flight[]`.
- `app/api/flight-status/route.ts` — accepts carrier+flightNo+date, calls `getProvider().status()`.
- Prisma model `CachedOffer { id String @id, payload Json, createdAt DateTime @default(now()) }`
  (+ migration). Holds the mapped offer (and enough raw context) for ~30 min so booking can
  resolve the exact selected flight without regenerating it.

**Changed**
- Flight search results page → its server-side data loading calls a shared loader
  `lib/flights/search.ts` (which calls `getProvider().search()` and writes results to `CachedOffer`)
  instead of `generateFlights`. `app/api/flight-search/route.ts` is a thin wrapper exposing the same
  loader for any client-side/AI use. The AI flow already navigates to `/search` with query params,
  so it benefits automatically.
- `app/api/bookings/route.ts` → resolve the selected flight from `CachedOffer` by id (Amadeus path);
  fall back to `decodeId` + `generateFlights` (mock path). Everything after (snapshot, simulated
  payment, slip) is unchanged.
- `app/track/.../page.tsx` (and/or its data source) → fetch real status from `/api/flight-status`
  using the booked segment's carrier+flightNo+date; fall back to the synthetic timeline when no
  data is returned.
- `.env` → add `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`, `AMADEUS_BASE_URL`.
- `lib/flights/types.ts` → only if a mapped field is missing (most already exist).

## The ephemeral-offer problem (key design point)

Amadeus offers expire and cannot be regenerated, but the current booking flow regenerates a flight
from its id. Resolution: at search time, map each offer to a `Flight` with an app-generated id and
**persist it in `CachedOffer`**. Booking looks the offer up by id. Because booking is simulated, we
skip Amadeus Flight Offers Price / Create Orders entirely — the stored snapshot is the source of
truth for the confirmation slip and PDF (which already read `flightSnapshot`).

## Data flow

1. Search (form or AI) → `/search` params → `getProvider().search()` → mapped `Flight[]` → each
   cached in `CachedOffer` → rendered (fares derived as today via `lib/flights/fares.ts`).
2. Pick a fare → booking wizard (unchanged) → `/api/bookings` resolves the cached offer → stores
   `flightSnapshot` + simulated payment.
3. Confirmation slip + PDF — unchanged (read `flightSnapshot`).
4. `/track` → `/api/flight-status` (carrier+flightNo+date from the booking) → mapped real status →
   timeline; synthetic fallback when unavailable.

## Error handling & fallback

- **No keys** → `MockProvider` (current behavior).
- **Auth/search/status error, empty results, or 429/quota** → log and fall back to `MockProvider`
  for that request so the user always sees flights.
- **Status with no data** (common in Test env or for past/unsupported flights) → graceful
  "status unavailable" state or synthetic timeline; never an error page.
- Token caching avoids re-auth on every call; handle expiry by refetching once.

## Environment config

```
AMADEUS_CLIENT_ID="..."
AMADEUS_CLIENT_SECRET="..."
AMADEUS_BASE_URL="https://test.api.amadeus.com"   # flip to https://api.amadeus.com for Production
```

Obtain Test keys free at https://developers.amadeus.com (no card). Production keys (full data,
lots of options) require account verification + a card on file (free within the monthly quota).

## Testing

- **Unit:** mappers (`map.ts`) against saved Amadeus fixture JSON (offers + status) — no network;
  `getProvider()` selection logic (keys present vs absent).
- **Existing tests unchanged:** generator/pricing/fares unit tests and the booking-flow e2e run
  keyless → mock provider → keep passing.
- **Manual (with Test keys):** verify a Test-supported city pair returns real mapped offers and the
  booking flow works end-to-end; verify `/api/flight-status` maps a known flight.

## Rollout

1. Implement with mock fallback; verify keyless behavior unchanged (tests green).
2. Add Test keys to `.env`; verify real search + status on supported routes.
3. Later: verify Amadeus account → swap `AMADEUS_BASE_URL` + Production keys for full coverage.
   No code changes required.

## Verification (end to end)

- Keyless: `npm run test` + booking e2e pass; search shows generated flights.
- With Test keys: search a supported route → real airlines/options; book → slip/PDF correct;
  `/track` shows real status (or graceful fallback).
- Switching `AMADEUS_BASE_URL` to production + prod keys yields broad real options with no code change.
