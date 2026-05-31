# TRAVU — Phase 1 (Flights) Design Spec

**Date:** 2026-05-27
**Status:** Approved (brainstorming) — ready for implementation planning
**Scope:** First vertical slice of the TRAVU travel super-app: a complete, demo-quality **Flights** booking experience built on a shared foundation that later verticals (Stays, Cars, Packages, Things-to-Do) will reuse.

---

## 1. Context

TRAVU aims to be an AI-powered travel super-app that fixes the fragmented, cumbersome booking flows of incumbents (Booking.com, Expedia, Kayak). The full product is a dozen subsystems; building them all at once is unmanageable. We therefore decompose and build **one clean vertical end-to-end first** to establish the design language, the data/AI patterns, and the booking pipeline. Flights was chosen as the flagship vertical.

This spec covers **Phase 0 (shared foundation) + Phase 1 (Flights core flow + AI price prediction)** as a single deliverable. Success = a person can land on the site, search flights by natural language or form, see realistic results with a price-prediction insight, book a flight, pay (simulated), download an industry-style PDF e-ticket, and see the booking in their dashboard — all behind email/password auth, looking polished and on-brand.

## 2. Locked decisions

| Area | Decision |
|------|----------|
| First vertical | **Flights** |
| Phase 1 scope | Core flow **+ AI price prediction** |
| Flight data | **Seeded references + smart per-search generation** (mock, no GDS API) |
| AI search | **Real Claude (Anthropic)** — parses NL into a structured filter |
| Database | **PostgreSQL on Neon** (hosted free tier) via Prisma |
| Auth | **NextAuth, email + password** (credentials) |
| Market/currency | **USD, global** (multi-currency-ready underneath) |
| Aesthetic | **"Arctic Clean"** — light, minimal, Apple-like; sky→indigo gradient as accent; dark mode included |

## 3. In / Out of scope

**In (Phase 1):**
- Foundation: app scaffold, design system, responsive layout + nav, dark/light theme.
- Auth: signup, login, logout, session-gated booking/dashboard.
- Flight search: AI conversational search **and** a structured form.
- Results: list with sort/filter, realistic generated flights, price-prediction insight.
- Flight detail: fare breakdown, segments, layovers, baggage summary.
- Booking: passenger details → simulated payment → confirmation.
- Unique `bookingRef`, PDF e-ticket download, bookings dashboard.

**Out (later phases):** Stays, Cars, Packages, Things-to-Do; real payment processing; live flight-tracking page; price alerts/watch; multi-city itineraries; loyalty program; admin panel; 3D tours; crypto payments; courier integration.

## 4. Tech stack

- **Framework:** Next.js 15 (App Router), TypeScript, React 19.
- **UI:** Tailwind CSS, shadcn/ui, Framer Motion, lucide-react icons.
- **Server:** Next.js Route Handlers (`app/api/*`) — no separate backend service.
- **DB:** PostgreSQL (Neon), Prisma ORM.
- **Auth:** NextAuth (Auth.js) Credentials provider; passwords hashed with bcrypt; JWT session.
- **AI:** `@anthropic-ai/sdk` (Claude) with structured/tool output + prompt caching.
- **PDF:** `@react-pdf/renderer` for the e-ticket.
- **Validation:** Zod (shared schemas for forms, API, and AI output).
- **Testing:** Playwright (E2E), Vitest (unit).

## 5. App structure

```
app/
  layout.tsx, page.tsx                 # root layout + home
  (auth)/login/page.tsx, signup/page.tsx
  search/page.tsx                      # results
  flight/[id]/page.tsx                 # flight detail
  book/[id]/page.tsx                   # passenger + payment
  booking/[ref]/page.tsx               # confirmation
  dashboard/page.tsx                   # user's bookings
  api/
    auth/[...nextauth]/route.ts
    search/route.ts                    # structured search -> engine
    ai-search/route.ts                 # NL -> filter (Claude) -> engine
    predict/route.ts                   # price-prediction insight
    bookings/route.ts                  # create/list bookings
    ticket/[ref]/route.ts              # PDF e-ticket stream
components/
  ui/                                  # shadcn primitives
  layout/                              # nav, footer, theme toggle
  search/                              # AI search bar, form, filters
  flights/                            # result card, detail, fare table
lib/
  flights/  engine.ts generator.ts pricing.ts prediction.ts airports.ts
  ai/       searchParser.ts schema.ts
  auth/     options.ts password.ts
  pdf/      ticket.tsx
  db/       prisma.ts
  utils/    money.ts dates.ts ref.ts
prisma/
  schema.prisma, seed.ts
tests/
  e2e/booking-flow.spec.ts
  unit/{engine,pricing,prediction,searchParser}.test.ts
```

## 6. Data model (Prisma)

Reference data (seeded) + transactional data (created at runtime). **Generated flights are not persisted** — they are deterministic from `(origin, dest, date, flightKey)`; at purchase time the chosen flight is snapshotted into the booking.

- **User** — `id`, `email` (unique), `passwordHash`, `name`, `createdAt`.
- **Airport** — `iata` (PK), `name`, `city`, `country`, `lat`, `lng`, `timezone`.
- **Airline** — `iata` (PK), `name`, `brandColor`.
- **RouteServed** — `id`, `airlineIata`, `originIata`, `destIata` (which carriers fly which city pairs; drives generation and connections).
- **Booking** — `id`, `bookingRef` (unique, human-readable e.g. `TRV-8FK2QD`), `userId`, `status` (`CONFIRMED`/`CANCELLED`), `currency`, `totalAmount`, `flightSnapshot` (JSON: full itinerary), `createdAt`.
- **Passenger** — `id`, `bookingId`, `firstName`, `lastName`, `dateOfBirth`, `type` (`ADULT`/`CHILD`/`INFANT`).
- **Payment** — `id`, `bookingId`, `amount`, `currency`, `method` (`CARD_SIM`), `status` (`PAID`), `last4` (fake), `createdAt`.

## 7. Flight generation engine (`lib/flights/`)

- **Determinism:** a seeded PRNG keyed by `(originIata, destIata, dateISO)` so identical searches yield identical results (stable demos and tests).
- **`generator.ts`:** for a route+date, produce a realistic set of flights:
  - Nonstops from carriers in `RouteServed`; connecting itineraries via plausible hub airports when nonstop is sparse/long-haul.
  - Departure times spread across the day; durations derived from great-circle distance (haversine over `Airport` lat/lng) + cabin-independent block time; layover durations 60–240 min.
  - Cabins: Economy/Premium/Business with seat-availability counts.
- **`pricing.ts`:** `price = base(distanceKm, cabin) × demandMultiplier(daysToDeparture, seasonality) × seededVariance`. Returns a fare breakdown (base fare, taxes, fees).
- **`prediction.ts`:** deterministic trend over the next 7 days from the same demand curve → `{ direction: 'rise'|'fall'|'stable', pct, confidence, recommendation }`, surfaced as a Hopper-style insight on results and detail.
- **`engine.ts`:** orchestrates generate → filter (stops, cabin, budget, time window) → sort (price/duration/best) → paginate.

## 8. AI conversational search (`lib/ai/`)

- **`schema.ts`:** Zod `FlightFilter` = `{ origin?, destination?, departDate?, returnDate?, passengers?, cabin?, maxStops?, maxBudget?, departWindow?, arriveWindow?, sort? }`.
- **`searchParser.ts`:** calls Claude (`@anthropic-ai/sdk`) with the user's NL query and a tool/structured-output definition matching `FlightFilter`. System prompt is **prompt-cached**. IATA/city resolution validated against seeded `Airport` data; ambiguous inputs return a clarification hint rather than guessing.
- **Flow:** `ai-search` route → Claude → validated `FlightFilter` → `engine.search(filter)` → same result shape as the structured form. **Claude shapes the query only; it never fabricates flight results.**
- **Fallback:** if the AI call fails or the key is missing, the search bar degrades to keyword parsing + the structured form so the app still works.

## 9. Booking flow & states

1. **Select** flight from results/detail → `book/[id]` (flight key + search params encode the snapshot).
2. **Passenger details** form (Zod-validated) + contact email.
3. **Simulated payment** — fake card form, no real charge, basic Luhn/format validation only; always succeeds for valid-format input.
4. **Persist** `Booking` + `Passenger[]` + `Payment` with a generated `bookingRef`; snapshot the itinerary JSON.
5. **Confirmation** `booking/[ref]` → download **PDF e-ticket** (`api/ticket/[ref]`).
6. Booking appears in **`dashboard`** (auth-gated, user-scoped).

## 10. Auth

NextAuth Credentials provider. Signup hashes password (bcrypt) and creates `User`. Login issues a JWT session. `book/*`, `dashboard`, and booking APIs require a session; unauthenticated users are redirected to `/login?callbackUrl=…`. Search and results are public.

## 11. PDF e-ticket (`lib/pdf/ticket.tsx`)

`@react-pdf/renderer` document mimicking an airline e-ticket: TRAVU header, passenger name(s), `bookingRef` as both text and a **QR code**, flight segments (carrier, flight no., origin/dest, times, terminal/gate placeholders), fare summary, and IATA-style fine print. Streamed from `api/ticket/[ref]` as `application/pdf` (auth-gated, owner-only).

## 12. Design system — "Arctic Clean"

- **Light (default):** bg `#F4F8FC`, surfaces `#FFFFFF` (glassy: subtle border + soft shadow), text `#0F172A`, muted `#64748B`.
- **Accent gradient:** `#0EA5E9 → #818CF8` (sky → indigo) for primary CTAs, the AI search bar, active states, price highlights (`#0369A1`).
- **Dark mode:** slate-950 base, translucent surfaces, same accent gradient.
- **Type:** Inter or Geist; large confident headings, generous spacing.
- **Motion (Framer Motion):** page transitions, staggered result reveals on scroll, button/press micro-interactions, animated AI search bar. Purposeful, not decorative; respects `prefers-reduced-motion`.
- **Responsive:** mobile-first; results and booking flow optimized for phone width first.

## 13. API endpoints

- `POST /api/ai-search` — `{ query }` → `FlightFilter` + results.
- `GET /api/search` — structured params → results.
- `GET /api/predict` — flight/route params → prediction insight.
- `POST /api/bookings` — create booking (auth). `GET /api/bookings` — list user's bookings (auth).
- `GET /api/ticket/[ref]` — PDF e-ticket (auth, owner-only).
- `GET/POST /api/auth/[...nextauth]` — NextAuth.

## 14. Testing strategy

- **E2E (Playwright):** golden path — signup → AI search → select → passenger details → pay (sim) → confirmation → download ticket → see it in dashboard. Plus an edge case: unauthenticated user redirected to login when booking.
- **Unit (Vitest):** engine determinism, pricing breakdown math, prediction output shape, `searchParser` mapping NL → valid `FlightFilter` (Claude call mocked).

## 15. Environment / setup requirements

`.env.local` keys (documented in `.env.example`):
- `DATABASE_URL` — Neon Postgres connection string.
- `ANTHROPIC_API_KEY` — from console.anthropic.com (billing enabled).
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.

Setup: `npm install` → set env → `npx prisma migrate dev` + `npx prisma db seed` → `npm run dev`. App must run with these three credentials provisioned.

## 16. Future phases (context only)

Phase 2+: replicate the vertical pattern for Stays, then Cars/Packages/Things-to-Do; add live tracking, price alerts, multi-city, loyalty, admin, and real payment/AI integrations. Each gets its own spec → plan → implementation cycle.
