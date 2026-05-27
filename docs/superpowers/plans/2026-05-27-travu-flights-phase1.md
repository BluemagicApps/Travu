# TRAVU Flights (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, demo-quality Flights booking vertical for TRAVU — natural-language + form search over realistically-generated flight data, an AI price-prediction insight, email/password auth, a booking flow with simulated payment, a PDF e-ticket, and a bookings dashboard — on a reusable Next.js foundation.

**Architecture:** One Next.js 15 (App Router, TS) app. Server logic via Route Handlers. PostgreSQL (Neon) via Prisma holds reference data (airports, airlines, routes) and bookings; flights are generated deterministically per search and snapshotted into bookings at purchase. Claude (Anthropic SDK) converts natural language into a Zod-validated flight filter; it shapes the query only, never invents results. UI is the "Arctic Clean" design system (light-first, sky→indigo accents, dark mode) with Framer Motion.

**Tech Stack:** Next.js 15, TypeScript, Tailwind, shadcn/ui, Framer Motion, Prisma, Neon Postgres, NextAuth (credentials), @anthropic-ai/sdk, @react-pdf/renderer, Zod, Vitest, Playwright.

**Reference spec:** `docs/superpowers/specs/2026-05-27-travu-flights-phase1-design.md`

---

## Milestones (each ends in a running, testable app)

- **M1 — Foundation:** scaffold, design system, layout/nav, theme, Prisma+Neon, seed, test harness. → App runs, themed, DB seeded, smoke tests green.
- **M2 — Flight engine + form search + results:** deterministic generator, pricing, structured search, results page. → Form search returns realistic results.
- **M3 — AI search + price prediction + detail:** Claude parser, prediction model, AI search bar, flight detail. → NL search + prediction insight work.
- **M4 — Auth:** NextAuth credentials, signup/login, route gating. → Users sign up, log in, gated routes redirect.
- **M5 — Booking + payment + PDF + dashboard:** booking flow, simulated payment, PDF e-ticket, dashboard. → End-to-end book → ticket → dashboard.
- **M6 — E2E:** Playwright golden-path + edge tests. → Full journey covered by automation.

Pause for review after each milestone (per project brief).

---

## File Structure (locked decomposition)

```
app/                              # routes + API
  layout.tsx page.tsx globals.css
  (auth)/login/page.tsx (auth)/signup/page.tsx
  search/page.tsx flight/[id]/page.tsx book/[id]/page.tsx
  booking/[ref]/page.tsx dashboard/page.tsx
  api/auth/[...nextauth]/route.ts api/search/route.ts api/ai-search/route.ts
  api/predict/route.ts api/bookings/route.ts api/ticket/[ref]/route.ts
components/ui/* layout/* search/* flights/*
lib/flights/{engine,generator,pricing,prediction,airports}.ts
lib/ai/{schema,searchParser}.ts
lib/auth/{options,password}.ts
lib/pdf/ticket.tsx
lib/db/prisma.ts
lib/utils/{money,dates,ref,rng}.ts
prisma/{schema.prisma,seed.ts,data/*.ts}
tests/unit/*.test.ts tests/e2e/*.spec.ts
```

Each `lib/*` module has one responsibility and a typed interface so it can be tested in isolation.

---

# Milestone 1 — Foundation

### Task 1.1: Scaffold the Next.js app

**Files:** Create project in `C:\Users\Timel\Desktop\travu` (repo already initialized).

- [ ] **Step 1: Scaffold** (run in a real PowerShell window at the repo root; `create-next-app` is interactive-safe with these flags)

```powershell
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias "@/*" --eslint --no-turbopack
```
Expected: creates `app/`, `package.json`, `tsconfig.json`, `tailwind.config.ts`, etc. If it warns the directory isn't empty (README/.gitignore/docs exist), choose to continue — it merges.

- [ ] **Step 2: Verify it runs**

```powershell
npm run dev
```
Expected: dev server on http://localhost:3000 showing the Next.js starter. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```powershell
git add -A; git commit -m "chore: scaffold Next.js app"
```

### Task 1.2: Install dependencies

- [ ] **Step 1: Install runtime + dev deps**

```powershell
npm install @prisma/client next-auth@beta @anthropic-ai/sdk @react-pdf/renderer zod bcryptjs framer-motion lucide-react clsx tailwind-merge qrcode
npm install -D prisma vitest @vitejs/plugin-react @types/bcryptjs @playwright/test tsx @types/qrcode
npx playwright install chromium
```
Expected: all install without peer-dependency errors.

- [ ] **Step 2: Commit**

```powershell
git add package.json package-lock.json; git commit -m "chore: add project dependencies"
```

### Task 1.3: Environment config

**Files:** Create `.env.example`, `.env.local` (gitignored).

- [ ] **Step 1: Write `.env.example`**

```
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
ANTHROPIC_API_KEY="sk-ant-..."
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 2:** Copy to `.env.local` and fill real values: Neon `DATABASE_URL`, Anthropic key, and a generated `NEXTAUTH_SECRET`. (User action — see setup checklist at end.)

- [ ] **Step 3: Commit** `git add .env.example; git commit -m "chore: add env example"`

### Task 1.4: Design tokens + Tailwind theme ("Arctic Clean")

**Files:** Modify `app/globals.css`, `tailwind.config.ts`; Create `lib/utils/cn.ts`.

- [ ] **Step 1: `lib/utils/cn.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

- [ ] **Step 2: CSS variables in `globals.css`** — define light + dark tokens:

```css
:root {
  --bg: 244 248 252;        /* #F4F8FC */
  --surface: 255 255 255;
  --text: 15 23 42;         /* #0F172A */
  --muted: 100 116 139;     /* #64748B */
  --accent-from: 14 165 233;/* #0EA5E9 */
  --accent-to: 129 140 248; /* #818CF8 */
  --price: 3 105 161;       /* #0369A1 */
}
.dark {
  --bg: 2 6 23; --surface: 15 23 42; --text: 226 232 240; --muted: 148 163 184;
}
body { background: rgb(var(--bg)); color: rgb(var(--text)); }
```

- [ ] **Step 3: Map tokens in `tailwind.config.ts`** under `theme.extend.colors` (e.g. `bg: "rgb(var(--bg) / <alpha-value>)"`, same for surface/text/muted/accentFrom/accentTo/price), set `darkMode: "class"`, add a reusable `.btn-accent` utility using `bg-gradient-to-r from-accentFrom to-accentTo`.

- [ ] **Step 4: Commit** `git add app/globals.css tailwind.config.ts lib/utils/cn.ts; git commit -m "feat: arctic-clean design tokens"`

### Task 1.5: Root layout, nav, footer, theme toggle

**Files:** Modify `app/layout.tsx`; Create `components/layout/{Navbar,Footer,ThemeToggle,ThemeProvider}.tsx`.

- [ ] **Step 1:** `ThemeProvider` — client component using `next-themes` pattern (class strategy) or a minimal context that toggles `.dark` on `<html>` and persists to `localStorage`. (Install `next-themes` if preferred: `npm i next-themes`.)
- [ ] **Step 2:** `Navbar` — sticky, glassy (`bg-surface/70 backdrop-blur border-b`), logo "TRAVU" with accent gradient text, vertical tabs (Flights active; Stays/Cars/Packages/Things-to-Do shown disabled with "soon"), right side: ThemeToggle + Login link. Mobile: collapses to a bottom tab bar.
- [ ] **Step 3:** `Footer` — minimal links. `ThemeToggle` — sun/moon (lucide) button.
- [ ] **Step 4:** Wire into `app/layout.tsx` with `<ThemeProvider>`, metadata (title "TRAVU — AI travel super-app"), font (Geist or Inter via `next/font`).
- [ ] **Step 5: Verify** `npm run dev` → nav + theme toggle work in light/dark, mobile bottom bar appears at <768px.
- [ ] **Step 6: Commit** `git add -A; git commit -m "feat: app shell — nav, footer, theme toggle"`

### Task 1.6: Prisma schema + Neon connection

**Files:** Create `prisma/schema.prisma`, `lib/db/prisma.ts`.

- [ ] **Step 1: `prisma/schema.prisma`** (datasource `postgresql`, env `DATABASE_URL`):

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  name         String?
  createdAt    DateTime  @default(now())
  bookings     Booking[]
}
model Airport {
  iata     String  @id
  name     String
  city     String
  country  String
  lat      Float
  lng      Float
  timezone String
}
model Airline {
  iata       String @id
  name       String
  brandColor String
}
model RouteServed {
  id          String @id @default(cuid())
  airlineIata String
  originIata  String
  destIata    String
  @@unique([airlineIata, originIata, destIata])
  @@index([originIata, destIata])
}
model Booking {
  id            String      @id @default(cuid())
  bookingRef    String      @unique
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  status        String      @default("CONFIRMED")
  currency      String      @default("USD")
  totalAmount   Int
  flightSnapshot Json
  createdAt     DateTime    @default(now())
  passengers    Passenger[]
  payment       Payment?
}
model Passenger {
  id          String   @id @default(cuid())
  bookingId   String
  booking     Booking  @relation(fields: [bookingId], references: [id])
  firstName   String
  lastName    String
  dateOfBirth DateTime
  type        String   @default("ADULT")
}
model Payment {
  id        String   @id @default(cuid())
  bookingId String   @unique
  booking   Booking  @relation(fields: [bookingId], references: [id])
  amount    Int
  currency  String   @default("USD")
  method    String   @default("CARD_SIM")
  status    String   @default("PAID")
  last4     String
  createdAt DateTime @default(now())
}
```
(Money stored as integer minor units — cents.)

- [ ] **Step 2: `lib/db/prisma.ts`** — singleton client:

```ts
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
```

- [ ] **Step 3: Migrate** `npx prisma migrate dev --name init` → tables created in Neon. Expected: "migration applied".
- [ ] **Step 4: Commit** `git add prisma lib/db; git commit -m "feat: prisma schema + neon"`

### Task 1.7: Seed reference data

**Files:** Create `prisma/data/{airports,airlines,routes}.ts`, `prisma/seed.ts`; modify `package.json` (`"prisma": { "seed": "tsx prisma/seed.ts" }`).

- [ ] **Step 1: `prisma/data/airports.ts`** — export `airports` array of ~30 major global hubs with real IATA, city, country, lat, lng, timezone (e.g. LOS, LHR, JFK, DXB, CDG, AMS, IST, JNB, NBO, ACC, DOH, SIN, HKG, LAX, ORD, GRU, DEL, BOM, CAI, FRA, MAD, BCN, YYZ, SYD, NRT, PEK, ADD, CMN, ABV, PHC). Each `{ iata, name, city, country, lat, lng, timezone }`.
- [ ] **Step 2: `prisma/data/airlines.ts`** — ~15 carriers `{ iata, name, brandColor }` (e.g. EK Emirates #D71921, BA #075AAA, AF, KL, QR, TK, ET Ethiopian, KQ Kenya, VS, DL, AA, LH, SQ, AT, WB Rwandair). Use plausible brand hexes.
- [ ] **Step 3: `prisma/data/routes.ts`** — export a function generating `RouteServed` rows: for each airline, assign a realistic set of city pairs among its hub region + long-haul links (ensure popular demo routes like LOS↔DXB, LOS↔LHR, JFK↔LHR, DXB↔JFK have ≥2 carriers). Bidirectional.
- [ ] **Step 4: `prisma/seed.ts`** — `deleteMany` all ref tables then `createMany` airports, airlines, routes (idempotent reseed).
- [ ] **Step 5: Seed** `npx prisma db seed` → "Seeded N airports, M airlines, K routes". Verify with `npx prisma studio` (optional).
- [ ] **Step 6: Commit** `git add prisma package.json; git commit -m "feat: seed airports, airlines, routes"`

### Task 1.8: Test harness (Vitest + Playwright)

**Files:** Create `vitest.config.ts`, `playwright.config.ts`, `tests/unit/smoke.test.ts`; modify `package.json` scripts (`"test": "vitest run"`, `"test:e2e": "playwright test"`).

- [ ] **Step 1: `vitest.config.ts`** — node environment, include `tests/unit/**`.
- [ ] **Step 2: Smoke test** `tests/unit/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";
describe("smoke", () => { it("runs", () => { expect(1 + 1).toBe(2); }); });
```

- [ ] **Step 3: Run** `npm test` → 1 passing.
- [ ] **Step 4: `playwright.config.ts`** — `baseURL: http://localhost:3000`, `webServer` runs `npm run dev`, project chromium + a mobile viewport.
- [ ] **Step 5: Commit** `git add -A; git commit -m "test: vitest + playwright harness"`

**✅ M1 done when:** `npm run dev` shows themed shell (light/dark, mobile bar), `npm test` green, DB migrated + seeded.

---

# Milestone 2 — Flight engine + form search + results

### Task 2.1: Seeded RNG + money/date utils (TDD)

**Files:** Create `lib/utils/rng.ts`, `lib/utils/money.ts`, `lib/utils/dates.ts`; Test `tests/unit/rng.test.ts`.

- [ ] **Step 1: Failing test** — `rng.test.ts`: same seed → same sequence; different seed → different.

```ts
import { describe, it, expect } from "vitest";
import { mulberry32, seedFrom } from "@/lib/utils/rng";
describe("rng", () => {
  it("is deterministic per seed", () => {
    const a = mulberry32(seedFrom("LOS","DXB","2026-06-12"));
    const b = mulberry32(seedFrom("LOS","DXB","2026-06-12"));
    expect(a()).toBe(b());
  });
  it("differs across seeds", () => {
    const a = mulberry32(seedFrom("LOS","DXB","2026-06-12"));
    const b = mulberry32(seedFrom("LOS","LHR","2026-06-12"));
    expect(a()).not.toBe(b());
  });
});
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/rng.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement `lib/utils/rng.ts`**

```ts
export function seedFrom(...parts: string[]): number {
  let h = 2166136261;
  for (const s of parts.join("|")) h = Math.imul(h ^ s.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 4: Run** → PASS. Add `money.ts` (cents↔USD formatting) and `dates.ts` (ISO helpers, daysBetween).
- [ ] **Step 5: Commit** `git add lib/utils tests/unit/rng.test.ts; git commit -m "feat: seeded rng + utils"`

### Task 2.2: Pricing model (TDD)

**Files:** Create `lib/flights/pricing.ts`; Test `tests/unit/pricing.test.ts`.

- [ ] **Step 1: Failing test** — assert: longer distance ⇒ higher base; business > economy; closer departure ⇒ higher demand multiplier; returns integer cents with `{ base, taxes, fees, total }` where `total = base+taxes+fees`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `priceFor({ distanceKm, cabin, daysToDeparture, rand })`: `base = round((40 + distanceKm * cabinFactor) * 100)`; `demand = 1 + clamp((21 - daysToDeparture)/21, 0, 1) * 0.6 + seasonal`; `variance = 0.9 + rand()*0.2`; `taxes = 18%`, `fees = $25`. Export `Fare` type.
- [ ] **Step 4: Run** → PASS. **Commit.**

### Task 2.3: Flight generator (TDD)

**Files:** Create `lib/flights/airports.ts` (haversine + airport lookup from DB), `lib/flights/generator.ts`; Test `tests/unit/generator.test.ts`.

- [ ] **Step 1: Failing test** — `generateFlights({ origin, dest, date, routes, airports })` returns ≥1 flight; identical inputs ⇒ identical output (deterministic); each flight has `{ id, carrier, flightNo, segments[], stops, durationMin, cabinsAvailable, fare }`; nonstop has 1 segment, connections have 2 with a layover 60–240 min.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** generator using `mulberry32(seedFrom(origin,dest,date))`: pick carriers from `routes` serving the pair (nonstop); if few, build connections via a hub airport also served; compute `durationMin` from haversine distance + buffers; spread departure times; encode a stable `id` = base64 of `origin|dest|date|carrier|flightNo`.
- [ ] **Step 4: Run** → PASS. **Commit.**

### Task 2.4: Search engine + filters/sort (TDD)

**Files:** Create `lib/flights/engine.ts`; Test `tests/unit/engine.test.ts`.

- [ ] **Step 1: Failing test** — `search(filter)` applies `maxStops`, `cabin`, `maxBudget`, `departWindow`; `sort` by `price|duration|best`; returns `{ flights, count }`. Deterministic.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (load airports/routes from Prisma, call generator, filter, sort, paginate). **Step 4:** PASS. **Commit.**

### Task 2.5: `/api/search` route

**Files:** Create `app/api/search/route.ts`; Test `tests/unit/search-api.test.ts` (call the handler with a Request).

- [ ] **Step 1:** Define `lib/ai/schema.ts` `FlightFilter` Zod schema NOW (shared by form + AI). Fields per spec §8.
- [ ] **Step 2: Failing test** — POST valid filter → 200 with `{ flights, count }`; invalid → 400.
- [ ] **Step 3: Implement** route: parse body with `FlightFilter.safeParse`, call `engine.search`, return JSON. **Step 4:** PASS. **Commit.**

### Task 2.6: Search form + results UI

**Files:** Create `components/search/SearchForm.tsx`, `components/flights/{FlightCard,ResultsFilters,ResultsSort,FlightSegments}.tsx`, `app/search/page.tsx`; update `app/page.tsx` (home hero with the form).

- [ ] **Step 1:** `SearchForm` (client) — origin/dest autocomplete (against `/api/airports` — add a tiny route returning seeded airports), date, passengers, cabin. On submit → navigate to `/search?…`.
- [ ] **Step 2:** `FlightCard` — glassy surface card: airline logo chip (brandColor), times, route, duration, stops badge, fare in accent `price` color, "Select" button (`.btn-accent`). Framer Motion staggered entrance.
- [ ] **Step 3:** `app/search/page.tsx` (server) — read params, call `engine.search`, render filters + sort + list of `FlightCard`. Empty state + loading skeleton.
- [ ] **Step 4:** Home hero — headline, the `SearchForm`, on the Arctic-Clean background with a subtle accent-gradient blob.
- [ ] **Step 5: Verify** `npm run dev` → search LOS→DXB returns realistic cards; filters/sort work; mobile layout clean.
- [ ] **Step 6: Commit** `git add -A; git commit -m "feat: flight search form + results"`

**✅ M2 done when:** form search returns realistic, deterministic results with working filters/sort, on both desktop and mobile.

---

# Milestone 3 — AI search + price prediction + flight detail

### Task 3.1: Claude search parser (TDD, mocked)

**Files:** Create `lib/ai/searchParser.ts`; Test `tests/unit/searchParser.test.ts` (mock the Anthropic SDK).

- [ ] **Step 1: Failing test** — given a mocked Claude response with tool output, `parseQuery("cheap nonstop Lagos to Dubai mid June, business")` returns a valid `FlightFilter` (origin LOS, dest DXB, maxStops 0, cabin BUSINESS, sort price). Invalid/ambiguous → `{ needsClarification: true, message }`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** using `@anthropic-ai/sdk` with a tool definition whose input schema mirrors `FlightFilter`; system prompt cached (`cache_control`); resolve city names → IATA via seeded airports; validate output with Zod. Reference the `claude-api` skill during implementation for caching + structured output patterns.
- [ ] **Step 4: Run** → PASS. **Commit.**

### Task 3.2: `/api/ai-search` route + AI search bar UI

**Files:** Create `app/api/ai-search/route.ts`, `components/search/AiSearchBar.tsx`.

- [ ] **Step 1:** Route: `{ query }` → `parseQuery` → if filter, `engine.search` and return `{ filter, flights, count }`; if clarification, return `{ needsClarification, message }`. Graceful fallback to keyword parse if `ANTHROPIC_API_KEY` missing.
- [ ] **Step 2:** `AiSearchBar` — prominent accent-gradient-bordered input with sparkle icon, placeholder examples, animated; submits to `/api/ai-search`, shows parsed filter as chips, routes to results. Lives on home + above results.
- [ ] **Step 3: Verify** `npm run dev` with real key → NL query returns correct results; missing key → falls back without crashing.
- [ ] **Step 4: Commit** `git add -A; git commit -m "feat: AI conversational search"`

### Task 3.3: Price prediction (TDD) + insight UI

**Files:** Create `lib/flights/prediction.ts`, `components/flights/PricePrediction.tsx`, `app/api/predict/route.ts`.

- [ ] **Step 1: Failing test** — `predict({ distanceKm, daysToDeparture })` returns `{ direction: 'rise'|'fall'|'stable', pct: number, confidence: number, recommendation: string }`, deterministic; near departure ⇒ 'rise'.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** from the same demand curve as pricing (next-7-day delta). **Step 4:** PASS.
- [ ] **Step 5:** `/api/predict` route + `PricePrediction` badge (Hopper-style: up/down arrow, color, "Book now / Wait" recommendation) shown on results header + detail.
- [ ] **Step 6: Commit** `git add -A; git commit -m "feat: AI price prediction"`

### Task 3.4: Flight detail page

**Files:** Create `app/flight/[id]/page.tsx`, `components/flights/FareBreakdown.tsx`.

- [ ] **Step 1:** Decode flight `id` + search params → regenerate the exact flight (deterministic), render segments timeline, fare breakdown, baggage summary, price prediction, "Continue to book" → `/book/[id]`.
- [ ] **Step 2: Verify** detail renders for a selected flight. **Step 3: Commit.**

**✅ M3 done when:** natural-language search works end-to-end with a price-prediction insight and a full flight-detail page.

---

# Milestone 4 — Auth

### Task 4.1: Password hashing util (TDD)

**Files:** Create `lib/auth/password.ts`; Test `tests/unit/password.test.ts`.

- [ ] **Step 1: Failing test** — `hash` then `verify` returns true; wrong password false. **Step 2:** FAIL. **Step 3:** implement with bcryptjs. **Step 4:** PASS. **Commit.**

### Task 4.2: NextAuth config

**Files:** Create `lib/auth/options.ts`, `app/api/auth/[...nextauth]/route.ts`.

- [ ] **Step 1:** `options.ts` — Credentials provider: look up `User` by email, `verify` password, return session user; JWT strategy; custom `/login` page.
- [ ] **Step 2:** Route handler exports `GET`/`POST` from `NextAuth(authOptions)`.
- [ ] **Step 3: Commit.**

### Task 4.3: Signup + login pages + gating

**Files:** Create `app/(auth)/signup/page.tsx`, `app/(auth)/login/page.tsx`, `app/api/signup/route.ts`, `middleware.ts`.

- [ ] **Step 1:** `/api/signup` — validate (Zod), ensure email unique, hash password, create `User`.
- [ ] **Step 2:** Signup + login forms (Arctic-Clean styled, accent CTA), client-side validation + server errors surfaced.
- [ ] **Step 3:** `middleware.ts` — protect `/book/:path*`, `/dashboard` → redirect to `/login?callbackUrl=…`. Navbar shows user/logout when authed.
- [ ] **Step 4: Verify** signup → login → session persists; visiting `/dashboard` logged-out redirects.
- [ ] **Step 5: Commit** `git add -A; git commit -m "feat: email/password auth + route gating"`

**✅ M4 done when:** users sign up, log in, and gated routes redirect correctly.

---

# Milestone 5 — Booking + payment + PDF + dashboard

### Task 5.1: Booking ref util (TDD)

**Files:** Create `lib/utils/ref.ts`; Test `tests/unit/ref.test.ts`.

- [ ] **Step 1: Failing test** — `makeRef()` matches `/^TRV-[A-Z0-9]{6}$/`. **Step 2:** FAIL. **Step 3:** implement (crypto-random base32, no ambiguous chars). **Step 4:** PASS. **Commit.**

### Task 5.2: Create-booking API (TDD)

**Files:** Create `app/api/bookings/route.ts`; Test `tests/unit/bookings-api.test.ts` (mock session + prisma).

- [ ] **Step 1: Failing test** — unauthenticated POST → 401; authenticated valid → creates Booking+Passengers+Payment, returns `{ bookingRef }`; `GET` returns only the caller's bookings.
- [ ] **Step 2:** FAIL. **Step 3:** Implement: validate body (Zod: flight snapshot, passengers, fake card), require session, `prisma.$transaction` to persist, generate ref. **Step 4:** PASS. **Commit.**

### Task 5.3: Booking flow UI (passenger + simulated payment)

**Files:** Create `app/book/[id]/page.tsx`, `components/flights/{PassengerForm,PaymentForm,BookingSummary}.tsx`.

- [ ] **Step 1:** `/book/[id]` (gated) — regenerate flight from id, show `BookingSummary`, `PassengerForm` (per passenger), `PaymentForm` (fake card; Luhn/format validation only). Submit → `/api/bookings` → redirect `/booking/[ref]`.
- [ ] **Step 2: Verify** full flow creates a booking. **Step 3: Commit.**

### Task 5.4: Confirmation + PDF e-ticket

**Files:** Create `app/booking/[ref]/page.tsx`, `lib/pdf/ticket.tsx`, `app/api/ticket/[ref]/route.ts`.

- [ ] **Step 1:** Confirmation page (gated, owner-only) — success animation, itinerary, ref, "Download e-ticket".
- [ ] **Step 2:** `ticket.tsx` — `@react-pdf/renderer` document: TRAVU header, passenger(s), `bookingRef` text + QR (via `qrcode` to dataURL), segments, fare, IATA-style fine print.
- [ ] **Step 3:** `/api/ticket/[ref]` — auth + ownership check, stream `application/pdf`.
- [ ] **Step 4: Verify** PDF downloads and opens with correct details. **Step 5: Commit.**

### Task 5.5: Dashboard

**Files:** Create `app/dashboard/page.tsx`.

- [ ] **Step 1:** (gated) list caller's bookings (cards: route, date, ref, status, re-download ticket link). Empty state CTA to search.
- [ ] **Step 2: Verify** booked trips appear. **Step 3: Commit.**

**✅ M5 done when:** a logged-in user books a flight, downloads a correct PDF e-ticket, and sees it in their dashboard.

---

# Milestone 6 — E2E

### Task 6.1: Golden-path Playwright test

**Files:** Create `tests/e2e/booking-flow.spec.ts`.

- [ ] **Step 1: Write test** — signup (unique email) → AI search "nonstop Lagos to Dubai next month" → select first result → fill passenger + fake card → confirm → assert `TRV-` ref visible → assert booking in `/dashboard`. (Mock or stub the Claude call via a test env flag that forces keyword fallback so E2E is deterministic and key-free.)
- [ ] **Step 2: Run** `npm run test:e2e` → PASS (headless chromium + mobile project).
- [ ] **Step 3: Edge test** — booking while logged out redirects to `/login`.
- [ ] **Step 4: Commit** `git add -A; git commit -m "test: e2e golden path"`

**✅ M6 done when:** `npm run test:e2e` passes the full journey on desktop + mobile viewports.

---

## Setup checklist (user actions, one-time)

1. **Neon:** create a free project at neon.tech → copy the connection string → put in `.env.local` as `DATABASE_URL`.
2. **Anthropic:** create a key at console.anthropic.com (billing enabled) → `ANTHROPIC_API_KEY`.
3. **Secret:** generate `NEXTAUTH_SECRET` (PowerShell: `[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))`).
4. Then: `npm install` → `npx prisma migrate dev` → `npx prisma db seed` → `npm run dev`.

## Verification (end-to-end)

- `npm test` (Vitest units: rng, pricing, generator, engine, searchParser, prediction, password, ref, APIs) all green.
- `npm run test:e2e` (Playwright golden path) green on desktop + mobile.
- Manual: home → AI search → results + prediction → detail → signup/login → book → simulated pay → confirmation → download PDF → dashboard.
