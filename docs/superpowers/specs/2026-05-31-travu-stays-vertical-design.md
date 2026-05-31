# TRAVU Stays (Hotels) Vertical — Design

**Date:** 2026-05-31
**Status:** Approved (brainstorming) — pending implementation plan
**Branch:** `feat/stays-vertical` (off `main`, after the flights stack landed)

## 1. Summary

The second vertical of the TRAVU travel super-app: a complete, demo-quality
**Stays (hotels)** booking experience that replicates the flights vertical's
pattern on the same shared foundation (auth, Postgres/Prisma, AI search,
currency, PDF, the provider seam). Real hotel data comes from **Duffel Stays**
on the same Duffel account/token already configured for flights; booking is
**simulated** (no real Duffel order, no real payment) and produces a
confirmation **voucher PDF** — the hotel analog of the flight e-ticket.

## 2. Goals

- A working Stays vertical reachable from the home page, consistent in look and
  flow with flights.
- Real hotel search results via Duffel Stays, with a synthetic fallback so the
  results page never 500s.
- AI natural-language search ("beachfront hotel in Barcelona, 2 nights, under
  $200") that resolves to structured search params.
- Simulated booking → confirmation page → downloadable voucher PDF.
- Bookings (flights + stays) visible together on the dashboard.

## 3. In / Out of scope

**In:**
- `lib/stays/` module: provider seam, Duffel Stays provider + mapper, synthetic
  mock generator, search engine with fallback, pure client-side facets.
- Routes: `/stays` (results), `/stay/[id]` (detail), `/book/stay/[id]`
  (booking form), `/stay-booking/[ref]` (confirmation + voucher).
- API: `/api/ai-stay-search`, `/api/stay-bookings`, `/api/voucher/[ref]`.
- New Prisma models: `StayBooking`, `StayGuest`, `StayPayment` (separate from
  flights' `Booking`).
- Home hero `Flights | Stays` tab toggle + navbar Stays link.
- Reuse of currency (`<Money>`, `formatMoney`), `@react-pdf/renderer`, auth, and
  the retry/fallback pattern.

**Out (later phases):**
- Real Duffel Stays orders or real payment processing.
- Cars, Packages, Things-to-Do verticals.
- Hotel reviews ingestion, maps/geo-radius UI, multi-room-per-booking pricing
  nuances beyond a room count, loyalty, price alerts.
- A dedicated place/geocoding dataset (we reuse the existing city dataset).

## 4. Architecture — `lib/stays/` (mirrors `lib/flights/`)

| File | Purpose |
|------|---------|
| `types.ts` | `Stay` type: hotel fields (name, city/area, coords, star rating, guest rating, images, amenities) + room-offer fields (room name, board type, refundable, check-in/out, nights, `totalPrice` in integer cents, currency, cancellation policy). |
| `provider.ts` | `StayProvider` interface (`searchStays(params)`, optional `getStay(id)`) + `getStayProvider()`: **Duffel Stays** when `DUFFEL_API_TOKEN` is set, else the synthetic **mock**. |
| `duffel/index.ts` | `DuffelStayProvider` — Duffel Stays Search API; retries transient/network errors (incl. `ECONNRESET`) ~3×, fast-fails on 4xx. |
| `duffel/map.ts` | Pure mapper: Duffel Stays JSON → `Stay[]`. Fixture-tested. |
| `mock/index.ts` | Deterministic synthetic hotel generator (seeded from destination + dates) for keyless dev and as the search fallback. |
| `search.ts` | `searchStays(params)`: call provider → `applyStayFilters` → cap to cheapest ~68 → cache offers via a single `CachedOffer.createMany` → **on any provider error, fall back to the mock generator**. |
| `facets.ts` | Pure functions for client-side filter (price range, star rating, guest rating, amenities, board type) and sort. No URL round-trips (learned from flights). |
| `offer-id.ts` | Encode/decode offer ids with an **underscore** prefix (`duffel_stay_…`) — colon prefixes broke as URL route params in flights. |

The generic **`CachedOffer`** table is reused unchanged (it stores arbitrary
JSON payloads keyed by id).

### Search params
`{ destination, checkIn, checkOut, adults, children, rooms }`. Destination is a
city resolved via an autocomplete backed by the existing airport/city dataset
(`lib/flights/geo.ts`) — no new place dataset. The mock generator keys off the
destination string; the Duffel provider maps the resolved city to a Duffel
location/lat-lng query.

## 5. Data model (Prisma) — Approach B (separate from flights)

```prisma
model StayBooking {
  id           String       @id @default(cuid())
  bookingRef   String       @unique
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  status       String       @default("CONFIRMED")
  currency     String       @default("USD")
  totalAmount  Int          // integer cents
  checkIn      DateTime
  checkOut     DateTime
  nights       Int
  rooms        Int
  contactEmail String?
  contactPhone String?
  staySnapshot Json          // hotel + room offer captured at booking time
  createdAt    DateTime     @default(now())
  guests       StayGuest[]
  payment      StayPayment?
}

model StayGuest {
  id            String      @id @default(cuid())
  stayBookingId String
  stayBooking   StayBooking @relation(fields: [stayBookingId], references: [id])
  firstName     String
  lastName      String
  type          String      @default("ADULT") // ADULT | CHILD
}

model StayPayment {
  id            String      @id @default(cuid())
  stayBookingId String      @unique
  stayBooking   StayBooking @relation(fields: [stayBookingId], references: [id])
  amount        Int
  currency      String      @default("USD")
  method        String      @default("CARD_SIM")
  status        String      @default("PAID")
  last4         String
  createdAt     DateTime    @default(now())
}
```

`User` gains `stayBookings StayBooking[]`. The flights `Booking` model is left
untouched. The dashboard merges `user.bookings` and `user.stayBookings` into one
chronological list, each row tagged with its product type.

## 6. Routes & data flow (mirrors flights)

1. **Home** (`app/page.tsx`): a `Flights | Stays` tab toggle on the search hero.
   The Stays tab renders a hotel search form (destination, check-in/out, guests,
   rooms) plus an AI search box.
2. **`/stays`** — results page. Server component awaits `searchStays()`, streams
   results via `<Suspense>` + a `StaysResultsSkeleton`. `StayResultsView`
   (client) holds the controlled facet sidebar/sort bar and filters in-memory.
3. **`/stay/[id]`** — hotel/offer detail. Resolves the offer from `CachedOffer`
   first, then falls back to regenerating from the decoded id (mock).
4. **`/book/stay/[id]`** — booking form: guests, contact, simulated card. Posts
   to `/api/stay-bookings`.
5. **`/stay-booking/[ref]`** — confirmation page; downloads the voucher PDF from
   `/api/voucher/[ref]`.

## 7. API routes

- **`/api/ai-stay-search`** — free text → `{ destination, checkIn, checkOut,
  adults, children, rooms, maxPrice?, amenities? }` via Anthropic structured
  output, reusing `lib/ai`.
- **`/api/stay-bookings`** — create a simulated `StayBooking` (+ `StayGuest`s,
  `StayPayment`), returns the `bookingRef`. Mirrors `/api/bookings`.
- **`/api/voucher/[ref]`** — render and serve the voucher PDF. Mirrors
  `/api/ticket/[ref]`.

## 8. Reused infrastructure (unchanged)

Auth (NextAuth), currency context + `<Money>` / `formatMoney`,
`@react-pdf/renderer` (new `StayVoucher` document in `lib/pdf/`), and the
provider retry + mock-fallback pattern from flights.

## 9. Error handling

- Duffel Stays errors — including intermittent `ECONNRESET` in this environment —
  retry ~3× on transient/network failures, fast-fail on 4xx.
- `searchStays()` falls back to the mock generator on any real-provider error so
  `/stays` never 500s.
- Live searches may be slow; results stream behind a skeleton (same UX as
  flights).
- Results capped to the cheapest ~68 and cached in one `createMany`.

## 10. Testing

- **Unit (vitest):**
  - `duffel/map.ts` — fixture (trimmed real-shaped Duffel Stays response) → `Stay[]`.
  - `facets.ts` — filter + sort correctness.
  - `search.ts` — provider-error path falls back to mock; cap + cache behavior.
  - AI param parsing — model mocked, asserts structured params.
  - Voucher data shaping.
- **E2E (Playwright):** keyless (mock) flow — open Stays tab → (AI and standard)
  search → `/stays` results → `/stay/[id]` → `/book/stay/[id]` → submit →
  `/stay-booking/[ref]` confirmation → voucher PDF available.

## 11. Conventions carried over from flights (do not relitigate)

- Offer ids use an **underscore** prefix, never a colon (URL-safe route params).
- Stops/price/rating filtering and sort are **client-side** on the curated
  result list — never push them back onto the URL (that re-ran the slow provider
  search in flights).
- Offers cached via a single `createMany`, not N upserts.
- Prices stored and computed as **integer cents**; displayed via `<Money>` /
  `formatMoney`.
- Booking is simulated end-to-end; no real orders or payments.

## 12. Open questions / risks

- **Duffel Stays availability on the test token** — must verify the configured
  token has Stays access and returns usable test inventory; if thin, the mock
  fallback covers demos.
- **Destination → Duffel location mapping** — Duffel Stays expects a location
  (geo radius or place); mapping from the city dataset needs validation during
  implementation.
