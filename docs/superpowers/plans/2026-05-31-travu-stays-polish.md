# TRAVU Stays Polish & Realistic Demo Data — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Stays vertical look like a real booking site — curated real-looking hotel data for popular cities plus a smart fallback, polished results cards (style B) and a gallery-rich hotel detail page (style B) — fully keyless and deterministic.

**Architecture:** A curated city dataset and a curated Unsplash photo pool feed a rewritten (but signature-identical, fully deterministic) `generateStays`. New optional `Stay` fields (`originalPrice`, `ratingWord`, `description`) plus a pure `ratingWordFor` helper drive the upgraded `StayCard` and detail page. Because the detail page regenerates the hotel from its id, every new attribute must be a pure function of the `(destination, checkIn, checkOut, index)` seed.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind v4, Vitest (unit), Playwright (e2e), lucide-react icons.

---

## Background the engineer must know

- **Determinism is mandatory.** `app/stay/[id]/page.tsx` → `resolveStay(id)` (`lib/stays/resolve.ts`) does NOT read persisted mock offers; it decodes the id back to `(destination, checkIn, checkOut, index)` and calls `generateStays(...)`, then `.find()`s the matching id. So the detail page only matches the card if generation is a pure function of the seed. The only randomness source is `mulberry32(hashStr(seed))` already in the generator. **Never** use `Math.random()` or `Date.now()` in generation code.
- **Id encoding is unchanged** (`lib/stays/offer-id.ts`): `mock_stay_<b64url(dest)>.<checkIn>.<checkOut>.<index>`.
- **Tests:** Vitest with the `@/` path alias (maps to repo root). Run a single test file with `npx vitest run tests/unit/<file>.test.ts`. Existing examples live in `tests/unit/stay-*.test.ts`.
- **Money:** `import { Money } from "@/components/Money"` → `<Money cents={...} />`.
- **Images:** Unsplash is remote; the existing card/detail use a plain `<img>` with `// eslint-disable-next-line @next/next/no-img-element`. Keep that convention.
- **Current `Stay` type** is in `lib/stays/types.ts`. `images: string[]` already; we add three optional fields.
- **Pre-existing lint debt:** 6 flights-component errors are out of scope; do not touch them. New stays code must be lint-clean.

## File Structure

**Create:**
- `lib/stays/rating.ts` — pure `ratingWordFor(score)` helper.
- `lib/stays/data/cities.ts` — curated city dataset + `getCityData()`.
- `lib/stays/data/photos.ts` — curated Unsplash URL pool + `pickPhotos()`.
- `tests/unit/stay-rating.test.ts`
- `tests/unit/stay-cities.test.ts`
- `tests/unit/stay-photos.test.ts`
- (generator assertions added to existing `tests/unit/stay-generator.test.ts`)

**Modify:**
- `lib/stays/types.ts` — add `originalPrice?`, `ratingWord?`, `description?`.
- `lib/stays/mock/generator.ts` — rewrite internals (same signature).
- `components/stays/StayCard.tsx` — polished card B.
- `app/stay/[id]/page.tsx` — gallery-rich detail B.
- Light consistency: `components/stays/StaysResultsSortBar.tsx` (score-chip/spacing only) — optional, no behaviour change.

---

## Task 1: `ratingWordFor` helper

**Files:**
- Create: `lib/stays/rating.ts`
- Test: `tests/unit/stay-rating.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/stay-rating.test.ts
import { describe, it, expect } from "vitest";
import { ratingWordFor } from "@/lib/stays/rating";

describe("ratingWordFor", () => {
  it("maps each band to its word", () => {
    expect(ratingWordFor(9.4)).toBe("Superb");
    expect(ratingWordFor(9.0)).toBe("Superb");
    expect(ratingWordFor(8.7)).toBe("Fabulous");
    expect(ratingWordFor(8.5)).toBe("Fabulous");
    expect(ratingWordFor(8.2)).toBe("Very good");
    expect(ratingWordFor(8.0)).toBe("Very good");
    expect(ratingWordFor(7.5)).toBe("Good");
    expect(ratingWordFor(7.0)).toBe("Good");
    expect(ratingWordFor(6.9)).toBe("Pleasant");
    expect(ratingWordFor(0)).toBe("Pleasant");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/stay-rating.test.ts`
Expected: FAIL — cannot resolve `@/lib/stays/rating`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/stays/rating.ts
/** Booking-site style word for a 0..10 guest score. */
export function ratingWordFor(score: number): string {
  if (score >= 9.0) return "Superb";
  if (score >= 8.5) return "Fabulous";
  if (score >= 8.0) return "Very good";
  if (score >= 7.0) return "Good";
  return "Pleasant";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/stay-rating.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add lib/stays/rating.ts tests/unit/stay-rating.test.ts
git commit -m "feat(stays): ratingWordFor helper for guest-score words"
```

---

## Task 2: Curated city dataset

**Files:**
- Create: `lib/stays/data/cities.ts`
- Test: `tests/unit/stay-cities.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/stay-cities.test.ts
import { describe, it, expect } from "vitest";
import { getCityData, CITY_DATA } from "@/lib/stays/data/cities";

describe("getCityData", () => {
  it("matches known cities case-insensitively", () => {
    const bcn = getCityData("barcelona");
    expect(bcn?.city).toBe("Barcelona");
    expect(getCityData("  BARCELONA ")?.city).toBe("Barcelona");
  });

  it("returns null for unknown cities", () => {
    expect(getCityData("Atlantis")).toBeNull();
  });

  it("every city has non-empty neighbourhoods, names and a positive tier", () => {
    for (const c of Object.values(CITY_DATA)) {
      expect(c.neighbourhoods.length).toBeGreaterThan(2);
      expect(c.hotelNames.length).toBeGreaterThan(4);
      expect(c.priceTier).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/stay-cities.test.ts`
Expected: FAIL — cannot resolve `@/lib/stays/data/cities`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/stays/data/cities.ts
export interface CityData {
  city: string;            // canonical display name
  neighbourhoods: string[];
  hotelNames: string[];    // real-sounding, generic enough for demo data
  priceTier: number;       // multiplier on base nightly price
}

/** Keyed by lowercased city name. */
export const CITY_DATA: Record<string, CityData> = {
  barcelona: {
    city: "Barcelona",
    neighbourhoods: ["Eixample", "Gothic Quarter", "Barceloneta", "Gràcia", "El Born", "Poblenou"],
    hotelNames: ["Arts Seafront Hotel", "Eixample Boutique", "Gaudí Grand", "Rambla Suites", "Barceloneta Bay Hotel", "Catalonia Plaza", "Montjuïc View Residence", "Born Design Hotel", "Passeig Palace", "Gothic Quarter Inn"],
    priceTier: 1.05,
  },
  paris: {
    city: "Paris",
    neighbourhoods: ["Le Marais", "Saint-Germain", "Montmartre", "Champs-Élysées", "Latin Quarter", "Opéra"],
    hotelNames: ["Le Marais Boutique", "Seine Rive Hotel", "Montmartre Maison", "Opéra Grand", "Saint-Germain Suites", "Élysées Palace", "Louvre View Residence", "Latin Quarter Inn", "Tuileries Hotel", "Bastille Design Hotel"],
    priceTier: 1.25,
  },
  rome: {
    city: "Rome",
    neighbourhoods: ["Centro Storico", "Trastevere", "Monti", "Prati", "Spanish Steps", "Vaticano"],
    hotelNames: ["Colosseo Grand", "Trastevere Boutique", "Pantheon Suites", "Via Veneto Palace", "Monti Residence", "Spanish Steps Hotel", "Trevi View Inn", "Prati Design Hotel", "Navona Plaza", "Aventino Garden Hotel"],
    priceTier: 1.0,
  },
  london: {
    city: "London",
    neighbourhoods: ["Westminster", "Shoreditch", "Kensington", "Covent Garden", "Soho", "South Bank"],
    hotelNames: ["Westminster Grand", "Shoreditch Boutique", "Kensington Residence", "Covent Garden Suites", "Thames View Hotel", "Soho Design Hotel", "Mayfair Palace", "South Bank Inn", "Camden Plaza", "Hyde Park Hotel"],
    priceTier: 1.4,
  },
  "new york": {
    city: "New York",
    neighbourhoods: ["Midtown", "SoHo", "Times Square", "Upper East Side", "Brooklyn Heights", "Chelsea"],
    hotelNames: ["Midtown Grand", "SoHo Boutique", "Times Square Suites", "Central Park Residence", "Chelsea Design Hotel", "Brooklyn Bridge Hotel", "Fifth Avenue Palace", "Hudson View Inn", "Tribeca Plaza", "Madison Hotel"],
    priceTier: 1.6,
  },
  tokyo: {
    city: "Tokyo",
    neighbourhoods: ["Shinjuku", "Shibuya", "Ginza", "Asakusa", "Roppongi", "Marunouchi"],
    hotelNames: ["Shinjuku Grand", "Shibuya Boutique", "Ginza Suites", "Asakusa Residence", "Roppongi Design Hotel", "Imperial View Hotel", "Marunouchi Palace", "Ueno Garden Inn", "Akihabara Plaza", "Tokyo Bay Hotel"],
    priceTier: 1.2,
  },
  dubai: {
    city: "Dubai",
    neighbourhoods: ["Downtown", "Marina", "Palm Jumeirah", "JBR", "Business Bay", "Deira"],
    hotelNames: ["Marina Grand", "Palm Boutique Resort", "Downtown Suites", "Burj View Residence", "JBR Beach Hotel", "Business Bay Palace", "Jumeirah Design Hotel", "Creek View Inn", "Deira Plaza", "Desert Pearl Hotel"],
    priceTier: 1.3,
  },
  amsterdam: {
    city: "Amsterdam",
    neighbourhoods: ["Jordaan", "Canal Ring", "De Pijp", "Centrum", "Oud-West", "Museumplein"],
    hotelNames: ["Canal Grand", "Jordaan Boutique", "De Pijp Suites", "Museumplein Residence", "Centrum Design Hotel", "Vondelpark View Hotel", "Herengracht Palace", "Oud-West Inn", "Dam Square Plaza", "Amstel Garden Hotel"],
    priceTier: 1.15,
  },
  lisbon: {
    city: "Lisbon",
    neighbourhoods: ["Alfama", "Baixa", "Chiado", "Bairro Alto", "Belém", "Príncipe Real"],
    hotelNames: ["Alfama Grand", "Chiado Boutique", "Baixa Suites", "Belém Residence", "Bairro Alto Design Hotel", "Tagus View Hotel", "Príncipe Palace", "Graça View Inn", "Rossio Plaza", "Lisboa Garden Hotel"],
    priceTier: 0.85,
  },
  berlin: {
    city: "Berlin",
    neighbourhoods: ["Mitte", "Kreuzberg", "Prenzlauer Berg", "Charlottenburg", "Friedrichshain", "Schöneberg"],
    hotelNames: ["Mitte Grand", "Kreuzberg Boutique", "Prenzlauer Suites", "Charlottenburg Residence", "Friedrichshain Design Hotel", "Spree View Hotel", "Brandenburg Palace", "Tiergarten Inn", "Alexanderplatz Plaza", "Berlin Garden Hotel"],
    priceTier: 0.95,
  },
  bangkok: {
    city: "Bangkok",
    neighbourhoods: ["Sukhumvit", "Silom", "Riverside", "Siam", "Chinatown", "Thonglor"],
    hotelNames: ["Sukhumvit Grand", "Riverside Boutique", "Silom Suites", "Siam Residence", "Thonglor Design Hotel", "Chao Phraya View Hotel", "Siam Palace", "Chinatown Inn", "Asok Plaza", "Bangkok Garden Hotel"],
    priceTier: 0.7,
  },
  istanbul: {
    city: "Istanbul",
    neighbourhoods: ["Sultanahmet", "Beyoğlu", "Karaköy", "Beşiktaş", "Kadıköy", "Şişli"],
    hotelNames: ["Sultanahmet Grand", "Karaköy Boutique", "Beyoğlu Suites", "Bosphorus Residence", "Beşiktaş Design Hotel", "Golden Horn View Hotel", "Taksim Palace", "Kadıköy Inn", "Galata Plaza", "Istanbul Garden Hotel"],
    priceTier: 0.8,
  },
};

/** Case-insensitive lookup by city name; null when not curated. */
export function getCityData(destination: string): CityData | null {
  return CITY_DATA[destination.trim().toLowerCase()] ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/stay-cities.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/stays/data/cities.ts tests/unit/stay-cities.test.ts
git commit -m "feat(stays): curated city dataset (12 cities) + getCityData"
```

---

## Task 3: Curated photo pool

**Files:**
- Create: `lib/stays/data/photos.ts`
- Test: `tests/unit/stay-photos.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/stay-photos.test.ts
import { describe, it, expect } from "vitest";
import { pickPhotos, PHOTO_POOL } from "@/lib/stays/data/photos";

// simple deterministic rng for testing
function rngFrom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("pickPhotos", () => {
  it("returns the requested count of distinct https urls", () => {
    const urls = pickPhotos(rngFrom(123), 6);
    expect(urls).toHaveLength(6);
    expect(new Set(urls).size).toBe(6);
    for (const u of urls) expect(u.startsWith("https://images.unsplash.com/")).toBe(true);
  });

  it("is deterministic for the same rng seed", () => {
    expect(pickPhotos(rngFrom(7), 5)).toEqual(pickPhotos(rngFrom(7), 5));
  });

  it("first photo is an exterior hero", () => {
    const urls = pickPhotos(rngFrom(42), 5);
    expect(PHOTO_POOL.exterior).toContain(urls[0]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/stay-photos.test.ts`
Expected: FAIL — cannot resolve `@/lib/stays/data/photos`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/stays/data/photos.ts
// Curated, keyless Unsplash CDN image URLs (direct images.unsplash.com — no
// rate limit, unlike the deprecated source.unsplash.com redirect endpoint).
const W = "w=640&q=70";

export const PHOTO_POOL = {
  exterior: [
    `https://images.unsplash.com/photo-1566073771259-6a8506099945?${W}`,
    `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?${W}`,
    `https://images.unsplash.com/photo-1564501049412-61c2a3083791?${W}`,
    `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?${W}`,
    `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?${W}`,
    `https://images.unsplash.com/photo-1571896349842-33c89424de2d?${W}`,
    `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?${W}`,
    `https://images.unsplash.com/photo-1561501900-3701fa6a0864?${W}`,
  ],
  room: [
    `https://images.unsplash.com/photo-1611892440504-42a792e24d32?${W}`,
    `https://images.unsplash.com/photo-1631049307264-da0ec9d70304?${W}`,
    `https://images.unsplash.com/photo-1590490360182-c33d57733427?${W}`,
    `https://images.unsplash.com/photo-1618773928121-c32242e63f39?${W}`,
    `https://images.unsplash.com/photo-1566665797739-1674de7a421a?${W}`,
    `https://images.unsplash.com/photo-1582719508461-905c673771fd?${W}`,
    `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?${W}`,
    `https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?${W}`,
  ],
  lobby: [
    `https://images.unsplash.com/photo-1564507592333-c60657eea523?${W}`,
    `https://images.unsplash.com/photo-1559599189-fe84dea4eb79?${W}`,
    `https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?${W}`,
    `https://images.unsplash.com/photo-1578683010236-d716f9a3f461?${W}`,
    `https://images.unsplash.com/photo-1592229505726-40bd2e22ddc4?${W}`,
    `https://images.unsplash.com/photo-1455587734955-081b22074882?${W}`,
  ],
  amenity: [
    `https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?${W}`,
    `https://images.unsplash.com/photo-1540541338287-41700207dee6?${W}`,
    `https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?${W}`,
    `https://images.unsplash.com/photo-1578898886225-c4a4f8b8b8f1?${W}`,
    `https://images.unsplash.com/photo-1551918120-9739cb430c6d?${W}`,
    `https://images.unsplash.com/photo-1584132967334-10e028bd69f7?${W}`,
  ],
} as const;

function takeDistinct(rng: () => number, arr: readonly string[], n: number, seen: Set<string>): string[] {
  const out: string[] = [];
  const pool = arr.filter((u) => !seen.has(u));
  // deterministic shuffle via seeded sort
  const shuffled = [...pool].sort(() => rng() - 0.5);
  for (const u of shuffled) {
    if (out.length >= n) break;
    out.push(u);
    seen.add(u);
  }
  return out;
}

/**
 * Return `count` distinct image URLs (one exterior hero first, the rest
 * drawn from room/lobby/amenity), deterministic for a given rng sequence.
 */
export function pickPhotos(rng: () => number, count: number): string[] {
  const seen = new Set<string>();
  const hero = takeDistinct(rng, PHOTO_POOL.exterior, 1, seen);
  const rest = takeDistinct(
    rng,
    [...PHOTO_POOL.room, ...PHOTO_POOL.lobby, ...PHOTO_POOL.amenity],
    count - 1,
    seen,
  );
  return [...hero, ...rest];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/stay-photos.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/stays/data/photos.ts tests/unit/stay-photos.test.ts
git commit -m "feat(stays): curated keyless Unsplash photo pool + pickPhotos"
```

---

## Task 4: Extend the `Stay` type

**Files:**
- Modify: `lib/stays/types.ts`

- [ ] **Step 1: Add the optional fields**

In `lib/stays/types.ts`, inside the `Stay` interface, add these three fields directly after the `images: string[];` line:

```ts
  images: string[]; // URLs (5–6 curated photos for the gallery)
  originalPrice?: number; // cents — pre-discount "was" price; absent when no discount
  ratingWord?: string; // e.g. "Fabulous" — derived from guestRating
  description?: string; // short blurb for the detail page
```

(Replace the existing `images: string[]; // ...` line with the block above; leave every other field unchanged.)

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `lib/stays/types.ts`. (Pre-existing unrelated errors, if any, are acceptable — none should mention the new fields.)

- [ ] **Step 3: Commit**

```bash
git add lib/stays/types.ts
git commit -m "feat(stays): add optional originalPrice, ratingWord, description to Stay"
```

---

## Task 5: Rewrite the generator (deterministic, curated-aware)

**Files:**
- Modify: `lib/stays/mock/generator.ts`
- Test: `tests/unit/stay-generator.test.ts` (add assertions)

- [ ] **Step 1: Add failing assertions to the existing generator test**

Append these tests inside the existing `describe("generateStays", ...)` block in `tests/unit/stay-generator.test.ts` (add the imports at the top of the file too):

```ts
// add to imports at top:
import { getCityData } from "@/lib/stays/data/cities";

// add inside describe("generateStays", () => { ... }):
  it("gives each stay 5–6 distinct photos", () => {
    for (const s of generateStays(params)) {
      expect(s.images.length).toBeGreaterThanOrEqual(5);
      expect(s.images.length).toBeLessThanOrEqual(6);
      expect(new Set(s.images).size).toBe(s.images.length);
    }
  });

  it("sets a ratingWord and description on every stay", () => {
    for (const s of generateStays(params)) {
      expect(s.ratingWord).toBeTruthy();
      expect(s.description && s.description.length).toBeGreaterThan(10);
    }
  });

  it("discounted stays have originalPrice greater than totalPrice", () => {
    const discounted = generateStays(params).filter((s) => s.originalPrice != null);
    expect(discounted.length).toBeGreaterThan(0);
    for (const s of discounted) {
      expect(s.originalPrice!).toBeGreaterThan(s.totalPrice);
    }
  });

  it("uses a real neighbourhood for a curated city", () => {
    const hoods = getCityData("Barcelona")!.neighbourhoods;
    for (const s of generateStays(params)) {
      expect(hoods).toContain(s.area);
    }
  });

  it("still returns a full non-empty list for an unknown city", () => {
    const out = generateStays({ ...params, destination: "Atlantis" });
    expect(out.length).toBe(24);
    expect(out[0].name).toContain("Atlantis");
  });
```

- [ ] **Step 2: Run to verify the new assertions fail**

Run: `npx vitest run tests/unit/stay-generator.test.ts`
Expected: the four new tests FAIL (no `images` ≥5, `ratingWord`/`description` undefined, no `originalPrice`, `area` not in curated set). The original 4 tests still pass.

- [ ] **Step 3: Rewrite the generator**

Replace the entire contents of `lib/stays/mock/generator.ts` with:

```ts
import type { BoardType, Stay, StayParams } from "../types";
import { nightsBetween } from "../schema";
import { encodeStayId } from "../offer-id";
import { getCityData } from "../data/cities";
import { pickPhotos } from "../data/photos";
import { ratingWordFor } from "../rating";

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fallback name parts for cities we don't curate.
const FALLBACK_PREFIXES = ["Grand", "Park", "Royal", "Plaza", "Riverside", "Central"];
const FALLBACK_SUFFIXES = ["Hotel", "Suites", "Boutique", "Residence", "Inn", "Palace"];
const FALLBACK_AREAS = ["Old Town", "City Centre", "Waterfront", "Marina", "Arts District", "Historic Quarter"];
const AMENITY_POOL = ["wifi", "pool", "parking", "gym", "spa", "breakfast", "bar", "ac", "pet_friendly"];
const BOARDS: BoardType[] = ["ROOM_ONLY", "BREAKFAST", "HALF_BOARD", "ALL_INCLUSIVE"];
const ROOMS = ["Standard Double", "Deluxe King", "Junior Suite", "Twin Room", "Executive Suite"];
const COUNT = 24;

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function buildDescription(name: string, area: string, city: string, stars: number, amenities: string[]): string {
  const hl = amenities.includes("spa")
    ? "a relaxing spa"
    : amenities.includes("pool")
      ? "an inviting pool"
      : amenities.includes("bar")
        ? "a stylish bar"
        : "comfortable rooms";
  return `Set in ${area}, ${name} is a ${stars}-star stay in the heart of ${city}, offering ${hl} and easy access to the city's main sights.`;
}

export function generateStays(params: StayParams): Stay[] {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  const rng = mulberry32(hashStr(`${params.destination}|${params.checkIn}|${params.checkOut}`));
  const curated = getCityData(params.destination);
  const cityName = curated?.city ?? params.destination;
  const tier = curated?.priceTier ?? 1;

  const out: Stay[] = [];
  for (let i = 0; i < COUNT; i++) {
    const stars = 2 + Math.floor(rng() * 4); // 2..5

    const name = curated
      ? `${cityName} ${pick(rng, curated.hotelNames)}`
      : `${pick(rng, FALLBACK_PREFIXES)} ${params.destination} ${pick(rng, FALLBACK_SUFFIXES)}`;
    const area = curated ? pick(rng, curated.neighbourhoods) : pick(rng, FALLBACK_AREAS);

    const baseRaw = 6000 + Math.floor(rng() * 22000) + stars * 3000; // cents/night
    const base = Math.round((baseRaw * tier) / 100) * 100;

    const amenityCount = 3 + Math.floor(rng() * 5);
    const amenities = [...AMENITY_POOL].sort(() => rng() - 0.5).slice(0, amenityCount);
    const board = pick(rng, BOARDS);
    const refundable = rng() > 0.35;
    const guestRating = Math.round((6.5 + rng() * 3.4) * 10) / 10; // 6.5..9.9
    const photoCount = 5 + Math.floor(rng() * 2); // 5 or 6
    const images = pickPhotos(rng, photoCount);

    const totalPrice = base * nights * params.rooms;
    // ~45% of stays carry a deal; savings 8%–30%, deterministic.
    const hasDeal = rng() < 0.45;
    const savings = 0.08 + rng() * 0.22;
    const originalPrice = hasDeal ? Math.round(totalPrice / (1 - savings) / 100) * 100 : undefined;

    out.push({
      id: encodeStayId({
        destination: params.destination,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        index: i,
      }),
      name,
      city: cityName,
      area,
      lat: 0,
      lng: 0,
      starRating: stars,
      guestRating,
      ratingWord: ratingWordFor(guestRating),
      reviewCount: 80 + Math.floor(rng() * 2400),
      images,
      amenities,
      roomName: pick(rng, ROOMS),
      boardType: board,
      refundable,
      cancellationPolicy: refundable ? "Free cancellation up to 48h before check-in" : "Non-refundable",
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      nights,
      pricePerNight: base,
      totalPrice,
      originalPrice,
      currency: "USD",
      description: buildDescription(name, area, cityName, stars, amenities),
    });
  }
  return out;
}
```

> Note on determinism: every `rng()` call sits in a fixed order per iteration, so `generateStays` stays a pure function of the seed — the detail page (which regenerates) gets identical results. The unknown-city fallback embeds `params.destination` in the name, satisfying the "name contains Atlantis" test.

- [ ] **Step 4: Run the generator tests**

Run: `npx vitest run tests/unit/stay-generator.test.ts`
Expected: PASS (original 4 + 5 new = 9 tests). In particular the determinism test (`a` vs `b` `toEqual`) still passes.

- [ ] **Step 5: Run the full unit suite for regressions**

Run: `npx vitest run tests/unit`
Expected: all stay unit tests PASS (no regressions in facets/search/resolve/etc).

- [ ] **Step 6: Commit**

```bash
git add lib/stays/mock/generator.ts tests/unit/stay-generator.test.ts
git commit -m "feat(stays): curated-aware deterministic generator (photos, deals, ratingWord, description)"
```

---

## Task 6: Polished results card (style B)

**Files:**
- Modify: `components/stays/StayCard.tsx`

- [ ] **Step 1: Replace the card implementation**

Replace the entire contents of `components/stays/StayCard.tsx` with:

```tsx
import Link from "next/link";
import { Star, Check, Wifi } from "lucide-react";
import type { Stay } from "@/lib/stays/types";
import { Money } from "@/components/Money";

export function StayCard({ stay }: { stay: Stay }) {
  const hasDeal = stay.originalPrice != null && stay.originalPrice > stay.totalPrice;
  const savePct = hasDeal
    ? Math.round((1 - stay.totalPrice / stay.originalPrice!) * 100)
    : 0;
  const extraAmenities = Math.max(0, stay.amenities.length - 4);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        {stay.images[0] && (
          <div className="relative sm:w-60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={stay.images[0]}
              alt={stay.name}
              className="h-48 w-full object-cover sm:h-full"
            />
            {hasDeal && (
              <span className="absolute left-2 top-2 rounded-full bg-price px-2 py-0.5 text-[10px] font-bold text-white shadow">
                Great deal · {savePct}% off
              </span>
            )}
          </div>
        )}
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{stay.name}</h3>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                {Array.from({ length: stay.starRating }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-1">
                  {stay.area ? `${stay.area}, ` : ""}
                  {stay.city}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="inline-block rounded-lg bg-price px-2 py-1 text-sm font-bold text-white">
                {stay.guestRating.toFixed(1)}
              </span>
              {stay.ratingWord && (
                <div className="text-[11px] font-semibold text-price">{stay.ratingWord}</div>
              )}
              <div className="text-[10px] text-muted">{stay.reviewCount} reviews</div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {stay.amenities.slice(0, 4).map((a) => (
              <span
                key={a}
                className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] capitalize text-muted"
              >
                {a === "wifi" && <Wifi className="h-2.5 w-2.5" />}
                {a.replace(/_/g, " ")}
              </span>
            ))}
            {extraAmenities > 0 && (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
                +{extraAmenities}
              </span>
            )}
          </div>

          <div className="mt-auto flex items-end justify-between pt-3">
            <div className="text-xs">
              <div className="text-muted">{stay.roomName}</div>
              <div className={stay.refundable ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}>
                {stay.refundable ? "Free cancellation" : "Non-refundable"}
              </div>
            </div>
            <div className="text-right">
              {hasDeal && (
                <div className="text-xs font-semibold text-muted line-through">
                  <Money cents={stay.originalPrice!} />
                </div>
              )}
              <div className="text-lg font-extrabold text-price">
                <Money cents={stay.totalPrice} />
                <span className="ml-1 text-[10px] font-medium text-muted">total</span>
              </div>
              <div className="text-[10px] text-muted">
                <Money cents={stay.pricePerNight} />/night · {stay.nights} night
                {stay.nights === 1 ? "" : "s"}
              </div>
              <Link
                href={`/stay/${encodeURIComponent(stay.id)}`}
                className="btn-accent mt-1 inline-block rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                View deal →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `components/stays/StayCard.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/stays/StayCard.tsx
git commit -m "feat(stays): polished results card B (photo, deal ribbon, rating word, per-night price)"
```

---

## Task 7: Gallery-rich hotel detail page (style B)

**Files:**
- Modify: `app/stay/[id]/page.tsx`

- [ ] **Step 1: Replace the detail page**

Replace the entire contents of `app/stay/[id]/page.tsx` with:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Check } from "lucide-react";
import { resolveStay } from "@/lib/stays/resolve";
import { Money } from "@/components/Money";

export default async function StayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stay = await resolveStay(decodeURIComponent(id));
  if (!stay) notFound();

  const hasDeal = stay.originalPrice != null && stay.originalPrice > stay.totalPrice;
  const gallery = stay.images.slice(0, 5);
  const extraPhotos = Math.max(0, stay.images.length - gallery.length);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-extrabold">{stay.name}</h1>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span className="flex items-center gap-0.5">
          {Array.from({ length: stay.starRating }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ))}
        </span>
        <span>·</span>
        <span>
          {stay.area ? `${stay.area}, ` : ""}
          {stay.city}
        </span>
      </div>

      {/* Gallery grid: large hero + up to 4 tiles */}
      {gallery[0] && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:grid-rows-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gallery[0]}
            alt={stay.name}
            className="col-span-2 row-span-2 h-48 w-full rounded-2xl object-cover sm:h-72"
          />
          {gallery.slice(1).map((src, i) => {
            const isLastTile = i === gallery.slice(1).length - 1 && extraPhotos > 0;
            return (
              <div key={src} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${stay.name} photo ${i + 2}`}
                  className="h-24 w-full rounded-xl object-cover sm:h-[8.75rem]"
                />
                {isLastTile && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/55 text-sm font-semibold text-white">
                    +{extraPhotos} photos
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-price px-2 py-1 text-sm font-bold text-white">
              {stay.guestRating.toFixed(1)}
            </span>
            {stay.ratingWord && <span className="font-semibold text-price">{stay.ratingWord}</span>}
            <span className="text-sm text-muted">· {stay.reviewCount} reviews</span>
          </div>

          {stay.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted">{stay.description}</p>
          )}

          <h2 className="mt-6 font-semibold">Popular amenities</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {stay.amenities.map((a) => (
              <span
                key={a}
                className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-xs capitalize text-muted"
              >
                <Check className="h-3 w-3 text-price" /> {a.replace(/_/g, " ")}
              </span>
            ))}
          </div>

          <h2 className="mt-6 font-semibold">Room</h2>
          <p className="mt-1 text-sm text-muted">
            {stay.roomName} · {stay.boardType.replace(/_/g, " ").toLowerCase()}
          </p>
          <p className="mt-1 text-sm text-muted">{stay.cancellationPolicy}</p>
        </div>

        <aside className="glass h-fit rounded-2xl p-4">
          <div className="text-sm text-muted">
            {stay.checkIn} → {stay.checkOut}
          </div>
          {hasDeal && (
            <div className="mt-1 text-sm font-semibold text-muted line-through">
              <Money cents={stay.originalPrice!} />
            </div>
          )}
          <div className="mt-0.5 text-2xl font-extrabold text-price">
            <Money cents={stay.totalPrice} />
          </div>
          <div className="text-xs text-muted">
            <Money cents={stay.pricePerNight} />/night · {stay.nights} night
            {stay.nights === 1 ? "" : "s"} total
          </div>
          {stay.refundable && (
            <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Free cancellation</div>
          )}
          <Link
            href={`/book/stay/${encodeURIComponent(stay.id)}`}
            className="btn-accent mt-3 block rounded-xl py-3 text-center text-sm font-semibold"
          >
            Reserve
          </Link>
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `app/stay/[id]/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/stay/[id]/page.tsx
git commit -m "feat(stays): gallery-rich hotel detail page B (photo grid, rating word, deal pricing)"
```

---

## Task 8: Full verification & e2e regression

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit suite**

Run: `npx vitest run tests/unit`
Expected: all PASS (the original 20 stay tests + the new rating/cities/photos/generator tests).

- [ ] **Step 2: Lint the new/changed stays code**

Run: `npm run lint`
Expected: no NEW errors in `lib/stays/**`, `components/stays/StayCard.tsx`, or `app/stay/[id]/page.tsx`. (The 6 pre-existing flights-component errors may still appear — they are out of scope and untouched.)

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build completes successfully (Compiled successfully). No type errors.

- [ ] **Step 4: Run the stays e2e**

Run: `npx playwright test tests/e2e/stay-flow.spec.ts`
Expected: PASS — search → book → voucher flow still works (ids and routes are unchanged). If Playwright browsers aren't installed, run `npx playwright install` first, then re-run.

- [ ] **Step 5: Manual smoke (optional but recommended)**

Start the dev server: `npm run dev`. In the browser:
- Visit `/stays?destination=Barcelona&checkIn=2026-06-14&checkOut=2026-06-16&adults=2&rooms=1`.
- Confirm: real Barcelona neighbourhoods, real photos, some cards show "Great deal" ribbons + strikethrough prices, rating words ("Fabulous" etc.).
- Click "View deal →" on a discounted hotel → detail page shows the gallery grid and the SAME price/deal as the card (determinism check).
- Try an uncurated city (e.g. `destination=Reykjavik`) → still renders a full list, fallback names contain "Reykjavik".

- [ ] **Step 6: Final commit (if any smoke fixes were needed)**

```bash
git add -A
git commit -m "test(stays): verify polish + realistic data (unit, lint, build, e2e)"
```

---

## Self-Review (completed by plan author)

**Spec coverage:**
- Curated city dataset → Task 2. Photo pool → Task 3. Smart fallback → Task 5 (unknown-city path + test). Determinism constraint → Task 5 note + generator test. Optional types → Task 4. `ratingWordFor` → Task 1. Card B → Task 6. Detail B (gallery) → Task 7. 5–6 photos → Task 5. Discounts/`originalPrice` → Task 5 + shown in Tasks 6/7. Testing (unit + e2e + build + lint) → Task 8. YAGNI guardrails honoured (no carousel JS, no map, no API). ✔ All spec sections map to a task.

**Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step shows full code. ✔

**Type consistency:** `originalPrice`/`ratingWord`/`description` defined in Task 4 are used identically in Tasks 5/6/7. `pickPhotos(rng, count)`, `getCityData(destination)`, `CITY_DATA`, `PHOTO_POOL`, `ratingWordFor(score)` signatures match across definition and use. `stay.images[0]`, `stay.pricePerNight`, `stay.totalPrice` match the existing `Stay` type. ✔
