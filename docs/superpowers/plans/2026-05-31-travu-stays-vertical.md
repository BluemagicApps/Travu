# TRAVU Stays (Hotels) Vertical Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, demo-quality Stays (hotels) vertical — real hotel search via Duffel Stays behind a provider seam (synthetic fallback), simulated booking, and a voucher PDF — mirroring the flights vertical.

**Architecture:** A new `lib/stays/` module mirrors `lib/flights/`: a `StayProvider` seam picks Duffel Stays when `DUFFEL_API_TOKEN` is set else a synthetic mock; `searchStays()` caps + caches offers and falls back to mock on any provider error. New Prisma models (`StayBooking`, `StayGuest`, `StayPayment`) keep stays fully separate from flights' `Booking`. Routes (`/stays`, `/stay/[id]`, `/book/stay/[id]`, `/stay-booking/[ref]`) and a voucher PDF reuse the flights UI patterns, currency, auth, and `@react-pdf/renderer`.

**Tech Stack:** Next.js 16 (App Router, server components + Suspense), React 19, Prisma 6 / Postgres, Zod 4, Anthropic SDK, `@react-pdf/renderer`, Tailwind 4, Vitest, Playwright.

---

## File Structure

**Create:**
- `lib/stays/types.ts` — `Stay`, `StayParams` types
- `lib/stays/schema.ts` — Zod `StayFilter` + URL helpers
- `lib/stays/offer-id.ts` — encode/decode mock offer ids (underscore-prefixed)
- `lib/stays/duffel/map.ts` — Duffel Stays JSON → `Stay[]`
- `lib/stays/duffel/provider.ts` — `DuffelStayProvider` (search + retry)
- `lib/stays/mock/generator.ts` — deterministic synthetic hotels
- `lib/stays/mock/provider.ts` — `MockStayProvider`
- `lib/stays/provider.ts` — `StayProvider` seam + `getStayProvider()`
- `lib/stays/facets.ts` — `computeStayFacets` + `filterAndSortStays`
- `lib/stays/offer-cache.ts` — `cacheStayOffers` + `getCachedStay`
- `lib/stays/search.ts` — `searchStays()` engine + `stayProviderKind()`
- `lib/stays/ai.ts` — `parseStayQuery()` (AI + keyword fallback)
- `lib/pdf/voucher.tsx` — `StayVoucher` PDF document
- `app/stays/page.tsx` — results page
- `app/stay/[id]/page.tsx` — detail page
- `app/book/stay/[id]/page.tsx` — booking form page
- `app/stay-booking/[ref]/page.tsx` — confirmation page
- `app/api/ai-stay-search/route.ts` — NL → stay params
- `app/api/stay-bookings/route.ts` — create simulated booking
- `app/api/voucher/[ref]/route.ts` — serve voucher PDF
- `components/stays/StayCard.tsx`, `StayResultsList.tsx`, `StayResultsView.tsx`, `StaysResultsSidebar.tsx`, `StaysResultsSortBar.tsx`, `StaysResultsSkeleton.tsx`, `StaySearchForm.tsx`, `StayBookingForm.tsx`, `StayBookingSummary.tsx`, `ConfirmedVoucher.tsx`
- Tests: `tests/unit/stay-offer-id.test.ts`, `stay-schema.test.ts`, `stay-map.test.ts`, `stay-generator.test.ts`, `stay-provider.test.ts`, `stay-facets.test.ts`, `stay-search.test.ts`, `stay-ai.test.ts`, `tests/unit/fixtures/duffel-stays.json`, `tests/e2e/stay-flow.spec.ts`

**Modify:**
- `prisma/schema.prisma` — add models + `User.stayBookings`
- `app/page.tsx` — Flights | Stays tab on the hero
- `components/layout/Navbar.tsx` — Stays link
- `app/dashboard/page.tsx` — merge flight + stay bookings

---

## Task 1: Prisma models for stays

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the models** (append after the `Payment` model, before/after `CachedOffer`)

```prisma
model StayBooking {
  id           String       @id @default(cuid())
  bookingRef   String       @unique
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  status       String       @default("CONFIRMED")
  currency     String       @default("USD")
  totalAmount  Int
  checkIn      DateTime
  checkOut     DateTime
  nights       Int
  rooms        Int          @default(1)
  contactEmail String?
  contactPhone String?
  staySnapshot Json
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
  type          String      @default("ADULT")
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

- [ ] **Step 2: Add the relation to `User`** — inside `model User { ... }`, after the `bookings Booking[]` line:

```prisma
  stayBookings StayBooking[]
```

- [ ] **Step 3: Create + apply the migration**

Run: `npx prisma migrate dev --name add_stay_booking`
Expected: "Your database is now in sync with your schema." and a new folder under `prisma/migrations/`. Prisma Client regenerates automatically.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (the new client types resolve).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(stays): StayBooking/StayGuest/StayPayment models + migration"
```

---

## Task 2: Stay domain types

**Files:**
- Create: `lib/stays/types.ts`

- [ ] **Step 1: Write the types** (no test — pure type declarations, validated by `tsc`)

```typescript
export type BoardType = "ROOM_ONLY" | "BREAKFAST" | "HALF_BOARD" | "ALL_INCLUSIVE";

export interface StayParams {
  /** Destination city name (resolved from the dataset). */
  destination: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children?: number;
  rooms: number;
}

export interface Stay {
  id: string;
  name: string;
  city: string;
  area: string; // neighbourhood / district
  lat: number;
  lng: number;
  starRating: number; // 1..5 (hotel class)
  guestRating: number; // 0..10 (review score)
  reviewCount: number;
  images: string[]; // URLs (mock uses picsum-style placeholders)
  amenities: string[]; // e.g. ["wifi","pool","parking"]
  roomName: string;
  boardType: BoardType;
  refundable: boolean;
  cancellationPolicy: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  pricePerNight: number; // cents
  totalPrice: number; // cents (pricePerNight * nights * rooms)
  currency: string; // ISO code, e.g. "USD"
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` → Expected: no errors.

```bash
git add lib/stays/types.ts
git commit -m "feat(stays): Stay + StayParams domain types"
```

---

## Task 3: Mock offer id encode/decode

The mock generator must produce ids that round-trip through a URL route param so `/stay/[id]` can regenerate a hotel when the cache misses. Use an **underscore** prefix (a colon broke as `%3A` in flights).

**Files:**
- Create: `lib/stays/offer-id.ts`
- Test: `tests/unit/stay-offer-id.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { encodeStayId, decodeStayId } from "@/lib/stays/offer-id";

describe("stay offer id", () => {
  it("round-trips destination/dates/index", () => {
    const id = encodeStayId({ destination: "Barcelona", checkIn: "2026-07-01", checkOut: "2026-07-03", index: 4 });
    expect(id.startsWith("mock_stay_")).toBe(true);
    expect(decodeStayId(id)).toEqual({
      destination: "Barcelona", checkIn: "2026-07-01", checkOut: "2026-07-03", index: 4,
    });
  });

  it("handles destinations with spaces", () => {
    const id = encodeStayId({ destination: "New York", checkIn: "2026-07-01", checkOut: "2026-07-02", index: 0 });
    expect(decodeStayId(id)?.destination).toBe("New York");
  });

  it("returns null for non-mock ids", () => {
    expect(decodeStayId("duffel_stay_abc")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/stay-offer-id.test.ts`
Expected: FAIL — "encodeStayId is not a function" / module not found.

- [ ] **Step 3: Write the implementation**

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/stay-offer-id.test.ts` → Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/stays/offer-id.ts tests/unit/stay-offer-id.test.ts
git commit -m "feat(stays): URL-safe mock offer id encode/decode"
```

---

## Task 4: Stay search schema (Zod)

**Files:**
- Create: `lib/stays/schema.ts`
- Test: `tests/unit/stay-schema.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { StayFilter } from "@/lib/stays/schema";

describe("StayFilter", () => {
  it("parses a valid query string record", () => {
    const r = StayFilter.safeParse({
      destination: "Barcelona", checkIn: "2026-07-01", checkOut: "2026-07-03",
      adults: "2", children: "1", rooms: "1",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.adults).toBe(2);
      expect(r.data.children).toBe(1);
      expect(r.data.rooms).toBe(1);
    }
  });

  it("defaults adults=2 rooms=1 when omitted", () => {
    const r = StayFilter.safeParse({ destination: "Rome", checkIn: "2026-07-01", checkOut: "2026-07-02" });
    expect(r.success && r.data.adults).toBe(2);
    expect(r.success && r.data.rooms).toBe(1);
  });

  it("rejects a checkOut not after checkIn", () => {
    const r = StayFilter.safeParse({ destination: "Rome", checkIn: "2026-07-02", checkOut: "2026-07-02" });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/stay-schema.test.ts` → Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
import { z } from "zod";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const StayFilter = z
  .object({
    destination: z.string().trim().min(1),
    checkIn: z.string().regex(ISO_DATE),
    checkOut: z.string().regex(ISO_DATE),
    adults: z.coerce.number().int().min(1).max(16).default(2),
    children: z.coerce.number().int().min(0).max(10).optional(),
    rooms: z.coerce.number().int().min(1).max(8).default(1),
    // client-side facet seeds (optional, from AI queries)
    maxPrice: z.coerce.number().int().min(0).optional(), // cents
    minStars: z.coerce.number().int().min(1).max(5).optional(),
  })
  .refine((f) => f.checkOut > f.checkIn, {
    message: "checkout_after_checkin",
    path: ["checkOut"],
  });

export type StayFilter = z.infer<typeof StayFilter>;

/** Whole nights between two YYYY-MM-DD dates (UTC, no DST drift). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = Date.parse(`${checkIn}T00:00:00Z`);
  const b = Date.parse(`${checkOut}T00:00:00Z`);
  return Math.max(1, Math.round((b - a) / 86400000));
}

/** StayParams for the provider, derived from a parsed filter. */
export function paramsFromFilter(f: StayFilter) {
  return {
    destination: f.destination,
    checkIn: f.checkIn,
    checkOut: f.checkOut,
    adults: f.adults,
    children: f.children,
    rooms: f.rooms,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/stay-schema.test.ts` → Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/stays/schema.ts tests/unit/stay-schema.test.ts
git commit -m "feat(stays): StayFilter zod schema + nights/params helpers"
```

---

## Task 5: Duffel Stays offer mapper

> **NOTE:** The exact Duffel Stays response shape must be confirmed against the live API during implementation (see spec §12). The fixture below is the trimmed, real-shaped contract this mapper targets; if a field path differs, update both fixture and mapper together so the test stays the contract.

**Files:**
- Create: `tests/unit/fixtures/duffel-stays.json`
- Create: `lib/stays/duffel/map.ts`
- Test: `tests/unit/stay-map.test.ts`

- [ ] **Step 1: Add the fixture** (`tests/unit/fixtures/duffel-stays.json`)

```json
{
  "data": {
    "results": [
      {
        "id": "res_001",
        "accommodation": {
          "name": "Hotel Arts Barcelona",
          "rating": 5,
          "review_score": 8.9,
          "location": {
            "address": { "city_name": "Barcelona", "region": "Eixample" },
            "geographic_coordinates": { "latitude": 41.3874, "longitude": 2.1959 }
          },
          "amenities": [{ "type": "wifi" }, { "type": "pool" }, { "type": "parking" }],
          "photos": [{ "url": "https://img.example/1.jpg" }, { "url": "https://img.example/2.jpg" }],
          "check_in_information": { "check_in_after_time": "15:00", "check_out_before_time": "11:00" }
        },
        "cheapest_rate_total_amount": "540.00",
        "cheapest_rate_currency": "USD",
        "rooms": [
          {
            "name": "Deluxe King",
            "rates": [
              {
                "total_amount": "540.00",
                "total_currency": "USD",
                "board_type": "room_only",
                "available_payment_methods": ["balance"],
                "conditions": [{ "type": "refundable", "title": "Free cancellation until 24h before" }]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Write the failing test** (`tests/unit/stay-map.test.ts`)

```typescript
import { describe, it, expect } from "vitest";
import fixture from "./fixtures/duffel-stays.json";
import { mapDuffelStays } from "@/lib/stays/duffel/map";

describe("mapDuffelStays", () => {
  it("maps Duffel Stays search results into Stay[]", () => {
    const stays = mapDuffelStays(fixture as never, {
      destination: "Barcelona", checkIn: "2026-07-01", checkOut: "2026-07-03", adults: 2, rooms: 1,
    });
    expect(stays).toHaveLength(1);
    const s = stays[0];
    expect(s.id).toBe("duffel_stay_res_001");
    expect(s.name).toBe("Hotel Arts Barcelona");
    expect(s.starRating).toBe(5);
    expect(s.guestRating).toBe(8.9);
    expect(s.area).toBe("Eixample");
    expect(s.amenities).toEqual(["wifi", "pool", "parking"]);
    expect(s.roomName).toBe("Deluxe King");
    expect(s.boardType).toBe("ROOM_ONLY");
    expect(s.refundable).toBe(true);
    expect(s.nights).toBe(2);
    expect(s.totalPrice).toBe(54000);
    expect(s.pricePerNight).toBe(27000);
    expect(s.currency).toBe("USD");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/stay-map.test.ts` → Expected: FAIL — module not found.

- [ ] **Step 4: Write the implementation** (`lib/stays/duffel/map.ts`)

```typescript
import type { BoardType, Stay, StayParams } from "../types";
import { nightsBetween } from "../schema";

export interface DuffelStaysResponse {
  data: { results: DuffelStayResult[] };
}
interface DuffelStayResult {
  id: string;
  accommodation: {
    name: string;
    rating?: number;
    review_score?: number;
    location?: {
      address?: { city_name?: string; region?: string };
      geographic_coordinates?: { latitude?: number; longitude?: number };
    };
    amenities?: { type: string }[];
    photos?: { url: string }[];
  };
  cheapest_rate_total_amount?: string;
  cheapest_rate_currency?: string;
  rooms?: {
    name?: string;
    rates?: {
      total_amount?: string;
      total_currency?: string;
      board_type?: string;
      conditions?: { type?: string; title?: string }[];
    }[];
  }[];
}

const cents = (s: string | undefined): number => Math.round(Number(s ?? "0") * 100);

const BOARD: Record<string, BoardType> = {
  room_only: "ROOM_ONLY",
  breakfast: "BREAKFAST",
  half_board: "HALF_BOARD",
  all_inclusive: "ALL_INCLUSIVE",
};

export function mapDuffelStays(json: DuffelStaysResponse, params: StayParams): Stay[] {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  const out: Stay[] = [];
  for (const r of json.data.results ?? []) {
    const a = r.accommodation;
    const room = r.rooms?.[0];
    const rate = room?.rates?.[0];
    const total = cents(rate?.total_amount ?? r.cheapest_rate_total_amount);
    if (total <= 0) continue;
    const refundable = (rate?.conditions ?? []).some((c) => c.type === "refundable");
    out.push({
      id: `duffel_stay_${r.id}`,
      name: a.name,
      city: a.location?.address?.city_name ?? params.destination,
      area: a.location?.address?.region ?? "",
      lat: a.location?.geographic_coordinates?.latitude ?? 0,
      lng: a.location?.geographic_coordinates?.longitude ?? 0,
      starRating: a.rating ?? 0,
      guestRating: a.review_score ?? 0,
      reviewCount: 0,
      images: (a.photos ?? []).map((p) => p.url),
      amenities: (a.amenities ?? []).map((m) => m.type),
      roomName: room?.name ?? "Standard Room",
      boardType: BOARD[rate?.board_type ?? "room_only"] ?? "ROOM_ONLY",
      refundable,
      cancellationPolicy:
        (rate?.conditions ?? []).find((c) => c.type === "refundable")?.title ??
        (refundable ? "Refundable" : "Non-refundable"),
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      nights,
      pricePerNight: Math.round(total / nights),
      totalPrice: total,
      currency: rate?.total_currency ?? r.cheapest_rate_currency ?? "USD",
    });
  }
  return out;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/stay-map.test.ts` → Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/stays/duffel/map.ts tests/unit/stay-map.test.ts tests/unit/fixtures/duffel-stays.json
git commit -m "feat(stays): Duffel Stays offer mapper + fixture"
```

---

## Task 6: Synthetic mock generator

Deterministic hotels seeded from `destination + checkIn` so `/stay/[id]` regenerates the same hotel on a cache miss. Reuse the existing seeded RNG.

**Files:**
- Create: `lib/stays/mock/generator.ts`
- Test: `tests/unit/stay-generator.test.ts`

- [ ] **Step 1: Confirm the RNG helper exists**

Run: `npx vitest run tests/unit/rng.test.ts` and open `lib/flights/` for the rng module it imports (the flights generator seeds an RNG). Use the same module via its existing export. If the export is `mulberry32`/`hashStr` or similar, import those names; otherwise add a tiny local seeded RNG (below) inside `lib/stays/mock/generator.ts` to avoid coupling.

Local seeded RNG to embed if no shared export fits:

```typescript
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 2: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { generateStays } from "@/lib/stays/mock/generator";

const params = { destination: "Barcelona", checkIn: "2026-07-01", checkOut: "2026-07-03", adults: 2, rooms: 1 };

describe("generateStays", () => {
  it("is deterministic for the same params", () => {
    const a = generateStays(params);
    const b = generateStays(params);
    expect(a.map((s) => s.id)).toEqual(b.map((s) => s.id));
    expect(a[0].totalPrice).toBe(b[0].totalPrice);
  });

  it("produces mock_stay_ ids that decode back to the request", () => {
    const [first] = generateStays(params);
    expect(first.id.startsWith("mock_stay_")).toBe(true);
    expect(first.city).toBe("Barcelona");
    expect(first.nights).toBe(2);
    expect(first.totalPrice).toBe(first.pricePerNight * first.nights * params.rooms);
  });

  it("returns a non-trivial list", () => {
    expect(generateStays(params).length).toBeGreaterThanOrEqual(12);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/stay-generator.test.ts` → Expected: FAIL — module not found.

- [ ] **Step 4: Write the implementation**

```typescript
import type { BoardType, Stay, StayParams } from "../types";
import { nightsBetween } from "../schema";
import { encodeStayId } from "../offer-id";

// (embed hashStr + mulberry32 from Step 1 here if no shared RNG export fits)

const HOTEL_PREFIXES = ["Grand", "Park", "Royal", "Hotel", "The", "Casa", "Plaza", "Riverside"];
const HOTEL_SUFFIXES = ["Palace", "Suites", "Boutique", "Inn", "Residence", "Towers", "Garden", "Central"];
const AREAS = ["Old Town", "City Centre", "Waterfront", "Marina", "Arts District", "Historic Quarter"];
const AMENITY_POOL = ["wifi", "pool", "parking", "gym", "spa", "breakfast", "bar", "ac", "pet_friendly"];
const BOARDS: BoardType[] = ["ROOM_ONLY", "BREAKFAST", "HALF_BOARD", "ALL_INCLUSIVE"];
const ROOMS = ["Standard Double", "Deluxe King", "Junior Suite", "Twin Room", "Executive Suite"];
const COUNT = 24;

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function generateStays(params: StayParams): Stay[] {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  const rng = mulberry32(hashStr(`${params.destination}|${params.checkIn}|${params.checkOut}`));
  const out: Stay[] = [];
  for (let i = 0; i < COUNT; i++) {
    const stars = 2 + Math.floor(rng() * 4); // 2..5
    const base = 6000 + Math.floor(rng() * 22000) + stars * 3000; // cents/night
    const amenityCount = 3 + Math.floor(rng() * 5);
    const amenities = [...AMENITY_POOL].sort(() => rng() - 0.5).slice(0, amenityCount);
    const board = pick(rng, BOARDS);
    const refundable = rng() > 0.35;
    out.push({
      id: encodeStayId({ destination: params.destination, checkIn: params.checkIn, checkOut: params.checkOut, index: i }),
      name: `${pick(rng, HOTEL_PREFIXES)} ${params.destination} ${pick(rng, HOTEL_SUFFIXES)}`,
      city: params.destination,
      area: pick(rng, AREAS),
      lat: 0,
      lng: 0,
      starRating: stars,
      guestRating: Math.round((6.5 + rng() * 3.4) * 10) / 10, // 6.5..9.9
      reviewCount: 80 + Math.floor(rng() * 2400),
      images: [`https://picsum.photos/seed/${encodeURIComponent(params.destination)}-${i}/640/420`],
      amenities,
      roomName: pick(rng, ROOMS),
      boardType: board,
      refundable,
      cancellationPolicy: refundable ? "Free cancellation up to 48h before check-in" : "Non-refundable",
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      nights,
      pricePerNight: base,
      totalPrice: base * nights * params.rooms,
      currency: "USD",
    });
  }
  return out;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/stay-generator.test.ts` → Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/stays/mock/generator.ts tests/unit/stay-generator.test.ts
git commit -m "feat(stays): deterministic synthetic hotel generator"
```

---

## Task 7: Provider seam + mock provider + Duffel provider

**Files:**
- Create: `lib/stays/mock/provider.ts`, `lib/stays/duffel/provider.ts`, `lib/stays/provider.ts`
- Test: `tests/unit/stay-provider.test.ts`

- [ ] **Step 1: Write `MockStayProvider`** (`lib/stays/mock/provider.ts`)

```typescript
import type { Stay, StayParams } from "../types";
import { generateStays } from "./generator";
import type { StayProvider } from "../provider";

export class MockStayProvider implements StayProvider {
  kind = "mock" as const;
  async searchStays(params: StayParams): Promise<Stay[]> {
    return generateStays(params);
  }
}
```

- [ ] **Step 2: Write `DuffelStayProvider`** (`lib/stays/duffel/provider.ts`) — mirrors `lib/flights/duffel/provider.ts` retry pattern

```typescript
import { mapDuffelStays, type DuffelStaysResponse } from "./map";
import type { StayProvider } from "../provider";
import type { Stay, StayParams } from "../types";

export class DuffelStayProvider implements StayProvider {
  kind = "duffel" as const;

  async searchStays(params: StayParams): Promise<Stay[]> {
    const token = process.env.DUFFEL_API_TOKEN ?? "";
    const version = process.env.DUFFEL_VERSION || "v2";
    // NOTE: confirm the exact Stays search endpoint + body during implementation.
    const url = "https://api.duffel.com/stays/search";
    const body = JSON.stringify({
      data: {
        location: { name: params.destination },
        check_in_date: params.checkIn,
        check_out_date: params.checkOut,
        rooms: params.rooms,
        guests: [
          ...Array.from({ length: params.adults }, () => ({ type: "adult" })),
          ...Array.from({ length: params.children ?? 0 }, () => ({ type: "child", age: 8 })),
        ],
      },
    });
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Duffel-Version": version,
            Authorization: `Bearer ${token}`,
          },
          body,
        });
      } catch (e) {
        lastErr = e; // network error (e.g. ECONNRESET) — retry
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      if (!res.ok) {
        const err = new Error(`duffel_stays_search_failed_${res.status}`);
        if (res.status < 500) throw err; // client error — fail fast
        lastErr = err;
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      const json = (await res.json()) as DuffelStaysResponse;
      return mapDuffelStays(json, params);
    }
    throw lastErr;
  }
}
```

- [ ] **Step 3: Write the seam** (`lib/stays/provider.ts`) — mirrors `lib/flights/provider.ts`

```typescript
import type { Stay, StayParams } from "./types";
import { MockStayProvider } from "./mock/provider";
import { DuffelStayProvider } from "./duffel/provider";

export interface StayProvider {
  kind: "duffel" | "mock";
  searchStays(params: StayParams): Promise<Stay[]>;
}

function hasDuffelToken(): boolean {
  return Boolean(process.env.DUFFEL_API_TOKEN);
}

let cached: StayProvider | null = null;
let cachedKind: "duffel" | "mock" | null = null;

export function getStayProvider(): StayProvider {
  const kind = hasDuffelToken() ? "duffel" : "mock";
  if (cached && cachedKind === kind) return cached;
  cachedKind = kind;
  cached = kind === "duffel" ? new DuffelStayProvider() : new MockStayProvider();
  return cached;
}

export function __resetStayProvider(): void {
  cached = null;
  cachedKind = null;
}
```

- [ ] **Step 4: Write the failing test** (`tests/unit/stay-provider.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getStayProvider, __resetStayProvider } from "@/lib/stays/provider";

describe("getStayProvider", () => {
  const original = process.env.DUFFEL_API_TOKEN;
  beforeEach(() => __resetStayProvider());
  afterEach(() => {
    if (original === undefined) delete process.env.DUFFEL_API_TOKEN;
    else process.env.DUFFEL_API_TOKEN = original;
    __resetStayProvider();
  });

  it("uses mock when no Duffel token", () => {
    delete process.env.DUFFEL_API_TOKEN;
    expect(getStayProvider().kind).toBe("mock");
  });

  it("uses duffel when token present", () => {
    process.env.DUFFEL_API_TOKEN = "test_token";
    expect(getStayProvider().kind).toBe("duffel");
  });
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/stay-provider.test.ts` → Expected: PASS (2 tests).

- [ ] **Step 6: Typecheck + commit**

Run: `npx tsc --noEmit` → Expected: no errors.

```bash
git add lib/stays/provider.ts lib/stays/mock/provider.ts lib/stays/duffel/provider.ts tests/unit/stay-provider.test.ts
git commit -m "feat(stays): StayProvider seam + mock & Duffel providers"
```

---

## Task 8: Facets (client-side filter + sort)

**Files:**
- Create: `lib/stays/facets.ts`
- Test: `tests/unit/stay-facets.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { computeStayFacets, filterAndSortStays, type StayFilterState } from "@/lib/stays/facets";
import type { Stay } from "@/lib/stays/types";

function stay(p: Partial<Stay>): Stay {
  return {
    id: "x", name: "H", city: "C", area: "A", lat: 0, lng: 0, starRating: 3, guestRating: 8,
    reviewCount: 10, images: [], amenities: [], roomName: "R", boardType: "ROOM_ONLY",
    refundable: true, cancellationPolicy: "", checkIn: "2026-07-01", checkOut: "2026-07-02",
    nights: 1, pricePerNight: 10000, totalPrice: 10000, currency: "USD", ...p,
  };
}

const list = [
  stay({ id: "a", starRating: 5, totalPrice: 30000, amenities: ["pool", "wifi"], guestRating: 9 }),
  stay({ id: "b", starRating: 3, totalPrice: 10000, amenities: ["wifi"], guestRating: 7 }),
  stay({ id: "c", starRating: 4, totalPrice: 20000, amenities: ["pool"], guestRating: 8.5 }),
];

describe("stay facets", () => {
  it("computes star + amenity counts and price bounds", () => {
    const f = computeStayFacets(list);
    expect(f.minPrice).toBe(10000);
    expect(f.maxPrice).toBe(30000);
    expect(f.starCounts[5]).toBe(1);
    expect(f.amenities.find((a) => a.key === "pool")?.count).toBe(2);
  });

  it("filters by min stars and amenities, sorts by price", () => {
    const state: StayFilterState = { minStars: 4, amenities: new Set(["pool"]), maxPrice: null, sort: "price" };
    const out = filterAndSortStays(list, state);
    expect(out.map((s) => s.id)).toEqual(["c", "a"]);
  });

  it("sorts by rating descending", () => {
    const state: StayFilterState = { minStars: 0, amenities: new Set(), maxPrice: null, sort: "rating" };
    expect(filterAndSortStays(list, state).map((s) => s.id)).toEqual(["a", "c", "b"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/stay-facets.test.ts` → Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
import type { Stay } from "./types";

export interface AmenityFacet {
  key: string;
  count: number;
}
export interface StayFacets {
  minPrice: number;
  maxPrice: number;
  starCounts: Record<number, number>; // 1..5
  amenities: AmenityFacet[];
}
export interface StayFilterState {
  minStars: number; // 0 = any
  amenities: Set<string>;
  maxPrice: number | null; // cents
  sort: "best" | "price" | "rating";
}

export function computeStayFacets(stays: Stay[]): StayFacets {
  const starCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const amenities = new Map<string, number>();
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = 0;
  for (const s of stays) {
    if (starCounts[s.starRating] !== undefined) starCounts[s.starRating]++;
    for (const a of s.amenities) amenities.set(a, (amenities.get(a) ?? 0) + 1);
    minPrice = Math.min(minPrice, s.totalPrice);
    maxPrice = Math.max(maxPrice, s.totalPrice);
  }
  return {
    minPrice: Number.isFinite(minPrice) ? minPrice : 0,
    maxPrice,
    starCounts,
    amenities: [...amenities.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count),
  };
}

function bestScore(s: Stay): number {
  // cheaper + higher-rated ranks first
  return s.totalPrice - s.guestRating * 2000;
}

export function filterAndSortStays(stays: Stay[], state: StayFilterState): Stay[] {
  let out = stays;
  if (state.minStars > 0) out = out.filter((s) => s.starRating >= state.minStars);
  if (state.maxPrice != null) out = out.filter((s) => s.totalPrice <= state.maxPrice!);
  if (state.amenities.size > 0)
    out = out.filter((s) => [...state.amenities].every((a) => s.amenities.includes(a)));

  out = [...out];
  if (state.sort === "price") out.sort((a, b) => a.totalPrice - b.totalPrice);
  else if (state.sort === "rating") out.sort((a, b) => b.guestRating - a.guestRating);
  else out.sort((a, b) => bestScore(a) - bestScore(b));
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/stay-facets.test.ts` → Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/stays/facets.ts tests/unit/stay-facets.test.ts
git commit -m "feat(stays): client-side facets (stars/amenities/price) + sort"
```

---

## Task 9: Offer cache helpers

Reuse the generic `CachedOffer` table (same as flights). Stay payloads coexist with flight payloads — ids are distinctly prefixed (`duffel_stay_` / `mock_stay_`).

**Files:**
- Create: `lib/stays/offer-cache.ts`

- [ ] **Step 1: Write the implementation** (no new unit test — exercised by Task 10's search test and E2E; mirrors `lib/flights/offer-cache.ts`)

```typescript
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Stay } from "./types";

const TTL_MS = 30 * 60 * 1000;

export async function cacheStayOffers(stays: Stay[]): Promise<void> {
  if (stays.length === 0) return;
  await prisma.cachedOffer.createMany({
    data: stays.map((s) => ({ id: s.id, payload: s as unknown as Prisma.InputJsonValue })),
    skipDuplicates: true,
  });
}

export async function getCachedStay(id: string): Promise<Stay | null> {
  const row = await prisma.cachedOffer.findUnique({ where: { id } });
  if (!row) return null;
  if (Date.now() - row.createdAt.getTime() > TTL_MS) return null;
  return row.payload as unknown as Stay;
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` → Expected: no errors.

```bash
git add lib/stays/offer-cache.ts
git commit -m "feat(stays): offer cache helpers reusing CachedOffer"
```

---

## Task 10: searchStays engine (cap + cache + fallback)

**Files:**
- Create: `lib/stays/search.ts`
- Test: `tests/unit/stay-search.test.ts`

- [ ] **Step 1: Write the failing test** (mock the provider + cache modules)

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const searchStaysMock = vi.fn();
vi.mock("@/lib/stays/provider", () => ({
  getStayProvider: () => ({ kind: "duffel", searchStays: searchStaysMock }),
}));
const generateStaysMock = vi.fn();
vi.mock("@/lib/stays/mock/generator", () => ({ generateStays: generateStaysMock }));
vi.mock("@/lib/stays/offer-cache", () => ({ cacheStayOffers: vi.fn().mockResolvedValue(undefined) }));

import { searchStays } from "@/lib/stays/search";
import { cacheStayOffers } from "@/lib/stays/offer-cache";

const params = { destination: "Rome", checkIn: "2026-07-01", checkOut: "2026-07-03", adults: 2, rooms: 1 };
const stay = (id: string, price: number) => ({ id, totalPrice: price }) as never;

describe("searchStays", () => {
  beforeEach(() => vi.clearAllMocks());

  it("caps to cheapest 68 and caches them", async () => {
    searchStaysMock.mockResolvedValue(Array.from({ length: 100 }, (_, i) => stay(`s${i}`, 100000 - i)));
    const out = await searchStays(params);
    expect(out).toHaveLength(68);
    expect(out[0].totalPrice).toBeLessThan(out[67].totalPrice);
    expect(cacheStayOffers).toHaveBeenCalledOnce();
  });

  it("falls back to the mock generator on provider error", async () => {
    searchStaysMock.mockRejectedValue(new Error("ECONNRESET"));
    generateStaysMock.mockReturnValue([stay("m1", 5000)]);
    const out = await searchStays(params);
    expect(out).toEqual([stay("m1", 5000)]);
    expect(generateStaysMock).toHaveBeenCalledWith(params);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/stay-search.test.ts` → Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
import type { Stay, StayParams } from "./types";
import { getStayProvider } from "./provider";
import { generateStays } from "./mock/generator";
import { cacheStayOffers } from "./offer-cache";

const MAX_RESULTS = 68;

export async function searchStays(params: StayParams): Promise<Stay[]> {
  const provider = getStayProvider();
  try {
    let stays = await provider.searchStays(params);
    if (stays.length > MAX_RESULTS) {
      stays = [...stays].sort((a, b) => a.totalPrice - b.totalPrice).slice(0, MAX_RESULTS);
    }
    if (provider.kind !== "mock") await cacheStayOffers(stays);
    return stays;
  } catch (e) {
    if (provider.kind === "mock") throw e;
    console.error(`[stay-search] ${provider.kind} provider failed; falling back to mock:`, e);
    return generateStays(params);
  }
}

export function stayProviderKind(): "duffel" | "mock" {
  return getStayProvider().kind;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/stay-search.test.ts` → Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/stays/search.ts tests/unit/stay-search.test.ts
git commit -m "feat(stays): searchStays engine (cap + cache + mock fallback)"
```

---

## Task 11: AI natural-language stay parser

Mirrors `lib/ai/searchParser.ts`: AI parse with a deterministic keyword fallback when there's no API key or the call fails.

**Files:**
- Create: `lib/stays/ai.ts`
- Test: `tests/unit/stay-ai.test.ts`

- [ ] **Step 1: Write the failing test** (covers the keyword fallback — no network)

```typescript
import { describe, it, expect } from "vitest";
import { keywordParseStay } from "@/lib/stays/ai";

describe("keywordParseStay", () => {
  it("extracts a known destination and defaults dates/guests", () => {
    const r = keywordParseStay("hotel in Barcelona for 2 adults", ["Barcelona", "Rome", "Paris"]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.filter.destination).toBe("Barcelona");
      expect(r.filter.adults).toBe(2);
      expect(r.filter.checkOut > r.filter.checkIn).toBe(true);
    }
  });

  it("asks for clarification when no known city is present", () => {
    const r = keywordParseStay("somewhere warm and cheap", ["Barcelona", "Rome"]);
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/stay-ai.test.ts` → Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
import Anthropic from "@anthropic-ai/sdk";

export interface StayQueryFilter {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms: number;
  maxPrice?: number; // cents
  minStars?: number;
}
export type StayParseResult =
  | { ok: true; filter: StayQueryFilter }
  | { ok: false; needsClarification: true; message: string };

function defaultCheckIn(): string {
  return new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
}
function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}
function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function keywordParseStay(query: string, cities: string[]): StayParseResult {
  const q = query.toLowerCase();
  const found = cities.find((c) => q.includes(c.toLowerCase()));
  if (!found) {
    return {
      ok: false,
      needsClarification: true,
      message: "Which city are you staying in? (e.g. “hotel in Barcelona next weekend”)",
    };
  }
  const adultsMatch = q.match(/(\d+)\s*(adult|guest|people|person)/);
  const adults = adultsMatch ? clampInt(Number(adultsMatch[1]), 1, 16) : 2;
  const checkIn = defaultCheckIn();
  return { ok: true, filter: { destination: found, checkIn, checkOut: addDays(checkIn, 2), adults, rooms: 1 } };
}

export async function parseStayQuery(query: string, cities: string[]): Promise<StayParseResult> {
  if (!process.env.ANTHROPIC_API_KEY) return keywordParseStay(query, cities);
  try {
    const client = new Anthropic();
    const today = new Date().toISOString().slice(0, 10);
    const system = `You translate a traveller's natural-language hotel request into JSON.
Known destination cities (map a place to one of these exact strings):
${cities.join("\n")}

Respond with ONLY a JSON object (no prose, no markdown fences) with these keys:
- destination: one of the cities above, or null
- checkIn: "YYYY-MM-DD" or null (resolve relative dates using the current date)
- checkOut: "YYYY-MM-DD" or null
- adults: integer or null
- children: integer or null
- rooms: integer or null
- maxPriceUsd: number (total) or null
- minStars: integer 1-5 or null
- needsClarification: boolean (true if destination is not resolvable)
- clarificationMessage: string or null`;
    const res = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 400,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `Current date: ${today}\nRequest: ${query}` }],
    });
    const block = res.content.find((b) => b.type === "text");
    const json = extractJson(block && block.type === "text" ? block.text : "");
    if (!json) return keywordParseStay(query, cities);
    if (json.needsClarification === true || !json.destination) {
      return {
        ok: false,
        needsClarification: true,
        message:
          typeof json.clarificationMessage === "string" && json.clarificationMessage
            ? json.clarificationMessage
            : "Which city are you staying in?",
      };
    }
    const checkIn = typeof json.checkIn === "string" ? json.checkIn : defaultCheckIn();
    return {
      ok: true,
      filter: {
        destination: String(json.destination),
        checkIn,
        checkOut: typeof json.checkOut === "string" ? json.checkOut : addDays(checkIn, 2),
        adults: typeof json.adults === "number" ? clampInt(json.adults, 1, 16) : 2,
        children: typeof json.children === "number" ? clampInt(json.children, 0, 10) : undefined,
        rooms: typeof json.rooms === "number" ? clampInt(json.rooms, 1, 8) : 1,
        maxPrice: typeof json.maxPriceUsd === "number" ? Math.round(json.maxPriceUsd * 100) : undefined,
        minStars: typeof json.minStars === "number" ? clampInt(json.minStars, 1, 5) : undefined,
      },
    };
  } catch {
    return keywordParseStay(query, cities);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/stay-ai.test.ts` → Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/stays/ai.ts tests/unit/stay-ai.test.ts
git commit -m "feat(stays): AI NL stay parser + keyword fallback"
```

---

## Task 12: API routes (AI search + booking)

**Files:**
- Create: `app/api/ai-stay-search/route.ts`, `app/api/stay-bookings/route.ts`

- [ ] **Step 1: Write `/api/ai-stay-search`**

First confirm how flights exposes its city list: open `lib/flights/dataset.ts` for `getAirportOptions()` and reuse the distinct city names. Build a `cities: string[]` from `getAirportOptions()` (`[...new Set(opts.map(o => o.city))]`).

```typescript
import { NextResponse } from "next/server";
import { getAirportOptions } from "@/lib/flights/dataset";
import { parseStayQuery } from "@/lib/stays/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { query } = (await req.json().catch(() => ({}))) as { query?: string };
  if (!query || !query.trim()) return NextResponse.json({ error: "empty_query" }, { status: 400 });
  const opts = await getAirportOptions();
  const cities = [...new Set(opts.map((o) => o.city))];
  const result = await parseStayQuery(query.trim(), cities);
  if (!result.ok) return NextResponse.json({ needsClarification: true, message: result.message });
  return NextResponse.json({ filter: result.filter });
}
```

- [ ] **Step 2: Write `/api/stay-bookings`** — mirrors `app/api/bookings/route.ts`

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getCachedStay } from "@/lib/stays/offer-cache";
import { generateStays } from "@/lib/stays/mock/generator";
import { decodeStayId } from "@/lib/stays/offer-id";
import type { Stay } from "@/lib/stays/types";
import { makeRef } from "@/lib/utils/ref";

export const runtime = "nodejs";

const Guest = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  type: z.enum(["ADULT", "CHILD"]).default("ADULT"),
});
const Body = z.object({
  stayId: z.string().min(1),
  guests: z.array(Guest).min(1).max(16),
  rooms: z.coerce.number().int().min(1).max(8).default(1),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  cardLast4: z.string().regex(/^\d{4}$/),
  cardBrand: z.string().trim().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  // Resolve the stay: cached offer first, else regenerate from a decoded mock id.
  let stay: Stay | null = await getCachedStay(parsed.data.stayId);
  if (!stay) {
    const decoded = decodeStayId(parsed.data.stayId);
    if (!decoded) return NextResponse.json({ error: "bad_stay_id" }, { status: 400 });
    stay =
      generateStays({
        destination: decoded.destination,
        checkIn: decoded.checkIn,
        checkOut: decoded.checkOut,
        adults: parsed.data.guests.filter((g) => g.type === "ADULT").length || 1,
        rooms: parsed.data.rooms,
      }).find((s) => s.id === parsed.data.stayId) ?? null;
  }
  if (!stay) return NextResponse.json({ error: "stay_unavailable" }, { status: 404 });

  const total = stay.pricePerNight * stay.nights * parsed.data.rooms;
  const bookingRef = makeRef();

  await prisma.stayBooking.create({
    data: {
      bookingRef,
      userId: session.user.id,
      currency: stay.currency,
      totalAmount: total,
      checkIn: new Date(`${stay.checkIn}T00:00:00Z`),
      checkOut: new Date(`${stay.checkOut}T00:00:00Z`),
      nights: stay.nights,
      rooms: parsed.data.rooms,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
      staySnapshot: stay as unknown as Prisma.InputJsonValue,
      guests: {
        create: parsed.data.guests.map((g) => ({
          firstName: g.firstName,
          lastName: g.lastName,
          type: g.type,
        })),
      },
      payment: {
        create: {
          amount: total,
          currency: stay.currency,
          method: parsed.data.cardBrand ? parsed.data.cardBrand.toUpperCase() : "CARD",
          status: "PAID",
          last4: parsed.data.cardLast4,
        },
      },
    },
  });

  return NextResponse.json({ bookingRef }, { status: 201 });
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` → Expected: no errors. (Confirm `makeRef` is exported from `lib/utils/ref` and `auth` from `lib/auth` — both are used identically by the flights booking route.)

- [ ] **Step 4: Commit**

```bash
git add app/api/ai-stay-search/route.ts app/api/stay-bookings/route.ts
git commit -m "feat(stays): AI stay-search + simulated stay-booking API routes"
```

---

## Task 13: Voucher PDF

**Files:**
- Create: `lib/pdf/voucher.tsx`, `app/api/voucher/[ref]/route.ts`
- Test: `tests/unit/voucher.test.ts`

- [ ] **Step 1: Read the existing e-ticket** — open `lib/pdf/ticket.tsx` and `app/api/ticket/[ref]/route.ts` to copy the `renderToBuffer` + `Document/Page/View/Text/StyleSheet` patterns and the auth/lookup/response wiring exactly.

- [ ] **Step 2: Write a data-shaping helper test** (`tests/unit/voucher.test.ts`) — keep PDF rendering out of the unit test; test the pure summary builder.

```typescript
import { describe, it, expect } from "vitest";
import { voucherSummary } from "@/lib/pdf/voucher";
import type { Stay } from "@/lib/stays/types";

const stay = { name: "Grand Rome Palace", city: "Rome", roomName: "Deluxe King", nights: 2,
  checkIn: "2026-07-01", checkOut: "2026-07-03", currency: "USD" } as Stay;

describe("voucherSummary", () => {
  it("builds nights x rooms line and total", () => {
    const s = voucherSummary({ stay, rooms: 2, totalAmount: 108000, guests: 3, bookingRef: "TRV-ABC123" });
    expect(s.title).toContain("Grand Rome Palace");
    expect(s.stayLine).toBe("2 nights · 2 rooms · 3 guests");
    expect(s.total).toBe("$1,080.00");
    expect(s.bookingRef).toBe("TRV-ABC123");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/voucher.test.ts` → Expected: FAIL — module not found.

- [ ] **Step 4: Write `lib/pdf/voucher.tsx`** — export both the pure `voucherSummary` helper and a `StayVoucher` React-PDF document. Use `formatMoney` from `lib/utils/currency.ts` (the server-side formatter the flights PDF uses).

```tsx
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/utils/currency";
import type { Stay } from "@/lib/stays/types";

export interface VoucherInput {
  stay: Stay;
  rooms: number;
  totalAmount: number; // cents
  guests: number;
  bookingRef: string;
}
export interface VoucherSummary {
  title: string;
  stayLine: string;
  datesLine: string;
  total: string;
  bookingRef: string;
}

export function voucherSummary(input: VoucherInput): VoucherSummary {
  const { stay, rooms, totalAmount, guests, bookingRef } = input;
  return {
    title: `${stay.name} — ${stay.city}`,
    stayLine: `${stay.nights} night${stay.nights === 1 ? "" : "s"} · ${rooms} room${rooms === 1 ? "" : "s"} · ${guests} guest${guests === 1 ? "" : "s"}`,
    datesLine: `${stay.checkIn} → ${stay.checkOut}`,
    total: formatMoney(totalAmount, stay.currency),
    bookingRef,
  };
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica" },
  h1: { fontSize: 18, marginBottom: 4 },
  muted: { color: "#666", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  total: { fontSize: 16, marginTop: 12 },
});

export function StayVoucher({ input }: { input: VoucherInput }) {
  const s = voucherSummary(input);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>TRAVU Stay Voucher</Text>
        <Text style={styles.muted}>Booking {s.bookingRef}</Text>
        <View style={styles.row}><Text>{s.title}</Text></View>
        <View style={styles.row}><Text>{s.stayLine}</Text></View>
        <View style={styles.row}><Text>{s.datesLine}</Text><Text>{input.stay.roomName}</Text></View>
        <Text style={styles.total}>Total paid: {s.total}</Text>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/voucher.test.ts` → Expected: PASS. (If `formatMoney`'s signature differs, align the call — confirm in `lib/utils/currency.ts`.)

- [ ] **Step 6: Write `app/api/voucher/[ref]/route.ts`** — mirror `app/api/ticket/[ref]/route.ts`

```typescript
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { StayVoucher } from "@/lib/pdf/voucher";
import type { Stay } from "@/lib/stays/types";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("unauthorized", { status: 401 });
  const { ref } = await params;
  const booking = await prisma.stayBooking.findUnique({
    where: { bookingRef: ref },
    include: { guests: true },
  });
  if (!booking || booking.userId !== session.user.id) return new Response("not_found", { status: 404 });

  const stay = booking.staySnapshot as unknown as Stay;
  const buffer = await renderToBuffer(
    <StayVoucher input={{ stay, rooms: booking.rooms, totalAmount: booking.totalAmount, guests: booking.guests.length, bookingRef: booking.bookingRef }} />,
  );
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="travu-voucher-${ref}.pdf"`,
    },
  });
}
```

- [ ] **Step 7: Typecheck + commit**

Run: `npx tsc --noEmit` → Expected: no errors.

```bash
git add lib/pdf/voucher.tsx app/api/voucher/[ref]/route.ts tests/unit/voucher.test.ts
git commit -m "feat(stays): voucher PDF document + /api/voucher route"
```

---

## Task 14: Results UI — page, view, card, sidebar, sort, skeleton

These mirror the flights components closely. **Read each named flights component first and adapt it**, changing flight concepts (airlines/stops/duration) to stay concepts (stars/amenities/rating) and `fare.total` → `totalPrice`.

**Files:**
- Create: `components/stays/StaysResultsSkeleton.tsx` (adapt `components/flights/ResultsSkeleton.tsx`)
- Create: `components/stays/StayCard.tsx` (adapt `FlightCard.tsx`: show image, name, star rating, guest rating, area, amenities chips, `<Money cents={stay.totalPrice} />`, "View deal" → `/stay/[id]`)
- Create: `components/stays/StayResultsList.tsx` (adapt `FlightResultsList.tsx`: maps stays → `StayCard`)
- Create: `components/stays/StaysResultsSidebar.tsx` (adapt `ResultsSidebar.tsx`: min-stars radios, amenity checkboxes, max-price slider — driven by `computeStayFacets`)
- Create: `components/stays/StaysResultsSortBar.tsx` (adapt `ResultsSortBar.tsx`: best | price | rating)
- Create: `components/stays/StayResultsView.tsx` (adapt `components/flights/ResultsView.tsx`: holds `StayFilterState`, calls `filterAndSortStays` in-memory, renders sidebar + sort + list. **Filtering stays client-side — never push facets to the URL**, per the flights lesson.)

- [ ] **Step 1: Build the leaf components** (`StaysResultsSkeleton`, `StayCard`, `StayResultsList`, `StaysResultsSidebar`, `StaysResultsSortBar`) by adapting their flights counterparts as described above. Use `<Money cents={...} />` from `components/Money.tsx` for all prices.

- [ ] **Step 2: Build `StayResultsView`** — controlled client component:

```tsx
"use client";
import { useMemo, useState } from "react";
import type { Stay } from "@/lib/stays/types";
import { computeStayFacets, filterAndSortStays, type StayFilterState } from "@/lib/stays/facets";
import { StaysResultsSidebar } from "./StaysResultsSidebar";
import { StaysResultsSortBar } from "./StaysResultsSortBar";
import { StayResultsList } from "./StayResultsList";

export function StayResultsView({ stays, initialMinStars = 0, initialMaxPrice = null }:
  { stays: Stay[]; initialMinStars?: number; initialMaxPrice?: number | null }) {
  const [state, setState] = useState<StayFilterState>({
    minStars: initialMinStars, amenities: new Set(), maxPrice: initialMaxPrice, sort: "best",
  });
  const facets = useMemo(() => computeStayFacets(stays), [stays]);
  const visible = useMemo(() => filterAndSortStays(stays, state), [stays, state]);
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
      <StaysResultsSidebar facets={facets} state={state} onChange={setState} />
      <div>
        <StaysResultsSortBar count={visible.length} sort={state.sort} onSort={(sort) => setState((s) => ({ ...s, sort }))} />
        <StayResultsList stays={visible} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build the results page** (`app/stays/page.tsx`) — adapt `app/search/page.tsx`'s server-component + Suspense streaming pattern:

```tsx
import { Suspense } from "react";
import { StayFilter, paramsFromFilter } from "@/lib/stays/schema";
import { searchStays } from "@/lib/stays/search";
import { StaySearchForm } from "@/components/stays/StaySearchForm";
import { StaysResultsSkeleton } from "@/components/stays/StaysResultsSkeleton";
import { StayResultsView } from "@/components/stays/StayResultsView";

async function StaysResults({ filter }: { filter: StayFilter }) {
  const stays = await searchStays(paramsFromFilter(filter));
  if (stays.length === 0) {
    return <div className="glass mt-6 rounded-2xl p-10 text-center text-muted">No stays found — try different dates or a nearby city.</div>;
  }
  return (
    <StayResultsView
      stays={stays}
      initialMinStars={filter.minStars ?? 0}
      initialMaxPrice={filter.maxPrice ?? null}
    />
  );
}

export default async function StaysPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const parsed = StayFilter.safeParse(sp);
  const filter = parsed.success ? parsed.data : null;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <StaySearchForm initial={filter ?? undefined} />
      {!filter ? (
        <div className="glass mt-6 rounded-2xl p-10 text-center text-muted">Pick a destination and dates above to search hotels.</div>
      ) : (
        <Suspense key={JSON.stringify(sp)} fallback={<StaysResultsSkeleton />}>
          <StaysResults filter={filter} />
        </Suspense>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Build `StaySearchForm`** (`components/stays/StaySearchForm.tsx`) — adapt `components/search/SearchForm.tsx`. Fields: destination (text/autocomplete from city list), check-in, check-out (date inputs), guests (adults/children), rooms. Plus an AI search bar (adapt `AiSearchBar.tsx`) that POSTs to `/api/ai-stay-search` and, on `{filter}`, navigates to `/stays?` with the filter as query params. On submit, navigate to `/stays?destination=...&checkIn=...&checkOut=...&adults=...&rooms=...`.

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc --noEmit` then `npm run build`
Expected: no type errors; `/stays` appears in the route list.

- [ ] **Step 6: Verify keyless render**

Run: `npm run dev`, open `http://localhost:3000/stays?destination=Barcelona&checkIn=2026-07-01&checkOut=2026-07-03&adults=2&rooms=1`
Expected: skeleton briefly, then ~24 mock hotel cards; toggling star/amenity/price filters updates the list instantly without a full page reload.

- [ ] **Step 7: Commit**

```bash
git add components/stays app/stays
git commit -m "feat(stays): results page, view, card, sidebar, sort, search form"
```

---

## Task 15: Detail page

**Files:**
- Create: `app/stay/[id]/page.tsx`

- [ ] **Step 1: Build the detail page** — resolve from cache, fall back to regenerating from the decoded id (mirrors how `app/flight/[id]/page.tsx` resolves):

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCachedStay } from "@/lib/stays/offer-cache";
import { generateStays } from "@/lib/stays/mock/generator";
import { decodeStayId } from "@/lib/stays/offer-id";
import type { Stay } from "@/lib/stays/types";
import { Money } from "@/components/Money";

async function resolveStay(id: string): Promise<Stay | null> {
  const cached = await getCachedStay(id);
  if (cached) return cached;
  const decoded = decodeStayId(id);
  if (!decoded) return null;
  return (
    generateStays({
      destination: decoded.destination, checkIn: decoded.checkIn, checkOut: decoded.checkOut, adults: 2, rooms: 1,
    }).find((s) => s.id === id) ?? null
  );
}

export default async function StayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stay = await resolveStay(decodeURIComponent(id));
  if (!stay) notFound();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{stay.name}</h1>
      <p className="text-muted">{stay.area}, {stay.city} · {"★".repeat(stay.starRating)} · {stay.guestRating}/10 ({stay.reviewCount} reviews)</p>
      {/* image, amenity chips, room + board, cancellation policy — adapt flight detail layout */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-xl"><Money cents={stay.totalPrice} /> <span className="text-muted text-sm">total · {stay.nights} nights</span></div>
        <Link href={`/book/stay/${encodeURIComponent(stay.id)}`} className="btn-primary">Reserve</Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + verify**

Run: `npx tsc --noEmit`; in dev, click a card on `/stays` → lands on `/stay/[id]` showing the same hotel; the "Reserve" button links to the booking page.
Expected: no type errors; detail renders.

- [ ] **Step 3: Commit**

```bash
git add app/stay
git commit -m "feat(stays): hotel detail page (cache + mock fallback resolution)"
```

---

## Task 16: Booking form + confirmation page

**Files:**
- Create: `components/stays/StayBookingForm.tsx`, `components/stays/StayBookingSummary.tsx`, `components/stays/ConfirmedVoucher.tsx`
- Create: `app/book/stay/[id]/page.tsx`, `app/stay-booking/[ref]/page.tsx`

- [ ] **Step 1: Build the booking page** (`app/book/stay/[id]/page.tsx`) — server component: require auth (redirect to `/login?next=...` if no session, like the flights book page), resolve the stay (reuse the `resolveStay` logic — extract it to `lib/stays/resolve.ts` and import in both Task 15 and here to stay DRY), render `StayBookingSummary` + `StayBookingForm`.

- [ ] **Step 2: Build `StayBookingForm`** (`components/stays/StayBookingForm.tsx`) — adapt `components/flights/BookingForm.tsx`: guest name rows (adults + children counts from the stay's params or a simple "lead guest" + extra guests), contact email/phone, simulated card fields (reuse `components/booking/CardBrandIcons.tsx` + the card-brand detection the flights form uses). On submit, POST to `/api/stay-bookings`; on `{bookingRef}`, `router.push('/stay-booking/' + bookingRef)`.

- [ ] **Step 3: Build the confirmation page** (`app/stay-booking/[ref]/page.tsx`) — server component: require auth, look up `prisma.stayBooking.findUnique({ where: { bookingRef }, include: { guests: true, payment: true } })`, 404 if not owned by the user, render `ConfirmedVoucher` with a "Download voucher (PDF)" link to `/api/voucher/[ref]`.

- [ ] **Step 4: Build `ConfirmedVoucher`** (`components/stays/ConfirmedVoucher.tsx`) — adapt `components/booking/ConfirmedTicket.tsx`: show hotel, dates, room, guests, total via `<Money>`, booking ref, and the PDF download button.

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc --noEmit` then `npm run build`
Expected: no type errors; `/book/stay/[id]`, `/stay-booking/[ref]`, `/api/voucher/[ref]` all in the route list.

- [ ] **Step 6: Commit**

```bash
git add components/stays app/book/stay app/stay-booking lib/stays/resolve.ts
git commit -m "feat(stays): booking form, simulated booking, confirmation + voucher download"
```

---

## Task 17: Home tab, navbar link, dashboard merge

**Files:**
- Modify: `app/page.tsx`, `components/layout/Navbar.tsx`, `app/dashboard/page.tsx`

- [ ] **Step 1: Home hero tabs** — in `app/page.tsx`, add a `Flights | Stays` toggle above the search hero. Reuse the visual pattern of `components/search/TripTypeTabs.tsx`. The Flights tab keeps the existing `SearchForm`; the Stays tab renders `StaySearchForm`. Keep it a small client component (`components/layout/VerticalTabs.tsx`) if `app/page.tsx` is a server component.

- [ ] **Step 2: Navbar link** — in `components/layout/Navbar.tsx`, add a "Stays" link to `/stays` next to the existing flights/search nav item, matching the existing link styling.

- [ ] **Step 3: Dashboard merge** — in `app/dashboard/page.tsx`, after the existing `prisma.booking.findMany`, also query `prisma.stayBooking.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { guests: true, payment: true } })`. Build a unified list tagging each row `{ kind: "flight" | "stay" }`, sort by `createdAt` desc, and render stay rows with hotel name + dates + total (link to `/stay-booking/[ref]`), flight rows unchanged.

- [ ] **Step 4: Typecheck + build + verify**

Run: `npx tsc --noEmit` then `npm run build`. In dev: home page shows both tabs; navbar has Stays; after booking a stay it appears on `/dashboard` alongside flights.
Expected: no type errors; both verticals reachable and listed together.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/layout/Navbar.tsx app/dashboard/page.tsx components/layout/VerticalTabs.tsx
git commit -m "feat(stays): home Flights|Stays tabs, navbar link, unified dashboard"
```

---

## Task 18: End-to-end test (keyless mock flow)

**Files:**
- Create: `tests/e2e/stay-flow.spec.ts`
- Reference: `tests/e2e/booking-flow.spec.ts` (reuse its auth/signup setup + hydration-wait helpers verbatim)

- [ ] **Step 1: Write the E2E spec** — adapt the flights booking-flow spec's structure (sign up / log in, then drive the UI). Steps:

```typescript
import { test, expect } from "@playwright/test";

test("stay search → detail → book → confirmation → voucher", async ({ page }) => {
  // 1. Authenticate (reuse the signup/login helper pattern from booking-flow.spec.ts).
  // 2. Go directly to a seeded search:
  await page.goto("/stays?destination=Barcelona&checkIn=2026-07-01&checkOut=2026-07-03&adults=2&rooms=1");
  await expect(page.getByText(/Barcelona/i).first()).toBeVisible();

  // 3. Open the first hotel.
  await page.getByRole("link", { name: /view deal|reserve|details/i }).first().click();
  await expect(page).toHaveURL(/\/stay\//);

  // 4. Reserve → booking form.
  await page.getByRole("link", { name: /reserve/i }).click();
  await expect(page).toHaveURL(/\/book\/stay\//);

  // 5. Fill guest + contact + simulated card, submit (selectors per StayBookingForm).
  //    Mirror the field-fill + hydration-wait approach in booking-flow.spec.ts.

  // 6. Land on confirmation.
  await expect(page).toHaveURL(/\/stay-booking\//);
  await expect(page.getByText(/voucher/i)).toBeVisible();

  // 7. Voucher PDF endpoint responds with a PDF.
  const ref = page.url().split("/stay-booking/")[1];
  const res = await page.request.get(`/api/voucher/${ref}`);
  expect(res.headers()["content-type"]).toContain("application/pdf");
});
```

- [ ] **Step 2: Run the E2E suite**

Run: `npm run test:e2e -- stay-flow`
Expected: PASS. (If selectors don't match, align them to the actual `data-testid`/roles you used in Tasks 14–16 — add `data-testid` attributes there if needed, matching how the flights components expose them.)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/stay-flow.spec.ts
git commit -m "test(stays): e2e keyless flow search→book→voucher"
```

---

## Task 19: Full verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Unit suite**

Run: `npm test`
Expected: all prior tests (73) plus the new stay tests pass; 0 failures.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: TypeScript passes; all new routes (`/stays`, `/stay/[id]`, `/book/stay/[id]`, `/stay-booking/[ref]`, `/api/ai-stay-search`, `/api/stay-bookings`, `/api/voucher/[ref]`) appear; no build errors.

- [ ] **Step 3: Manual smoke with the real provider (optional)** — with `DUFFEL_API_TOKEN` set, search a real city. If Duffel Stays returns no/thin inventory or errors, confirm the page still renders via the mock fallback (no 500). Note the outcome (this validates spec §12's open risks).

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 5: Final commit (if lint auto-fixed anything)**

```bash
git add -A
git commit -m "chore(stays): lint + verification sweep"
```

---

## Self-Review

**Spec coverage** (each §3 in-scope item → task):
- `lib/stays/` module (provider, mapper, mock, search, facets, offer-id) → Tasks 2–11 ✓
- Routes `/stays`, `/stay/[id]`, `/book/stay/[id]`, `/stay-booking/[ref]` → Tasks 14–16 ✓
- API `/api/ai-stay-search`, `/api/stay-bookings`, `/api/voucher/[ref]` → Tasks 12–13 ✓
- Prisma `StayBooking`/`StayGuest`/`StayPayment` → Task 1 ✓
- Home tab + navbar + dashboard merge → Task 17 ✓
- Currency/PDF/auth reuse → Tasks 13, 16 ✓
- Duffel retry + mock fallback → Tasks 7, 10 ✓
- Testing (unit + e2e) → Tasks throughout + 18–19 ✓

**Type consistency:** `Stay`/`StayParams` (Task 2) are used unchanged in mapper (5), generator (6), provider (7), facets (8), cache (9), search (10), API (12), PDF (13), pages (14–16). `searchStays(params: StayParams)` and `getStayProvider()` names are consistent across Tasks 7/10/14. `encodeStayId`/`decodeStayId` (Task 3) consumed by generator (6) and booking API (12) with matching `DecodedStayId` shape.

**Placeholder scan:** UI tasks (14–17) reference exact flights components to adapt and include the non-obvious code (view/page wiring); leaf presentational components are described by their concrete field mapping rather than repeated boilerplate — acceptable since they are direct adaptations of named existing files. No "TBD"/"handle edge cases"/"add validation" placeholders remain.

**Open risk carried from spec §12:** exact Duffel Stays endpoint/response shape (Tasks 5, 7) must be confirmed against the live API; the fixture is the contract and the mock fallback de-risks demos.
