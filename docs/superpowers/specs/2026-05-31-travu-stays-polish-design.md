# TRAVU Stays — Polish & Realistic Demo Data (Design)

**Date:** 2026-05-31
**Branch:** `feat/stays-polish` (off `main`)
**Status:** Approved design, ready for implementation plan

## Goal

Make the already-merged Stays vertical look like a real, professional
booking site without adding any external API dependency. Two threads:

1. **Realistic demo data** — replace the thin synthetic generator (random
   "Grand <City> Suites" names, picsum scenery photos) with curated,
   real-looking hotel data for popular cities plus a smarter generative
   fallback for any other city. Fully keyless, deterministic, never breaks.
2. **UI polish** — upgrade the results card and hotel detail page to a
   booking-site-grade layout (chosen via mockups: card style **B**, detail
   style **B**).

Out of scope: real hotel APIs (Duffel Stays returns 403 — see
`stays-vertical` memory), booking flow changes, map view, real review
lists, room-type selection.

## Hard constraint: determinism

The detail page does **not** persist mock offers. `resolveStay(id)`
(`lib/stays/resolve.ts`) regenerates the hotel by decoding the id back to
`(destination, checkIn, checkOut, index)` and calling `generateStays`,
then `.find()`-ing the matching id. Therefore **every** new attribute
(photos, discount/`originalPrice`, rating word, neighbourhood, name) MUST
be a pure deterministic function of that seed, so the regenerated detail
hotel is byte-identical to the one shown on the card. No `Math.random()`,
no `Date.now()` in generation. The existing `mulberry32(hashStr(seed))`
RNG is the single source of randomness.

The `Stay.id` encoding (`lib/stays/offer-id.ts`) is unchanged — still
`mock_stay_<b64url(dest)>.<checkIn>.<checkOut>.<index>`.

## 1. Data layer

### `lib/stays/data/cities.ts` (new)

A curated dataset keyed by lowercased city name for ~12 popular
destinations: Barcelona, Paris, Rome, London, New York, Tokyo, Dubai,
Amsterdam, Lisbon, Berlin, Bangkok, Istanbul.

Each entry:

```ts
interface CityData {
  city: string;            // canonical display name, e.g. "Barcelona"
  neighbourhoods: string[];// real districts, e.g. ["Eixample","Gothic Quarter","Barceloneta",...]
  hotelNames: string[];    // real-sounding names/brands for this city
  priceTier: number;       // multiplier on base price (e.g. NYC 1.6, Lisbon 0.8)
}
```

- `getCityData(destination: string): CityData | null` — case-insensitive
  exact match on the city name (trimmed).
- Hotel names are real-sounding but generic enough not to impersonate a
  specific real business misleadingly (it is demo data); a short
  per-city list (~10) reused deterministically by index is sufficient.

### `lib/stays/data/photos.ts` (new)

A curated pool of ~40 stable Unsplash photo URLs of the form
`https://images.unsplash.com/photo-<id>?w=<w>&q=<q>`. Keyless, served
from Unsplash's CDN (no rate limit on direct image URLs, unlike the
deprecated `source.unsplash.com` redirect endpoint).

- Loosely grouped by kind: `exterior`, `room`, `lobby`, `pool/amenity`,
  so a hotel's gallery is visually coherent (one exterior hero + interior
  shots) rather than random.
- Exported helper `pickPhotos(rng, count): string[]` returns `count`
  distinct URLs (one hero from `exterior`, the rest from the other
  groups), deterministic given the same `rng` sequence.

### `lib/stays/mock/generator.ts` (rewrite, same export signature)

`generateStays(params: StayParams): Stay[]` keeps its signature, count
(24), and id encoding. Changes inside:

1. Look up `getCityData(params.destination)`.
   - **Found:** draw `name` from `hotelNames`, `area` from
     `neighbourhoods`, multiply base price by `priceTier`.
   - **Not found (fallback):** improved generic naming (better prefix/
     suffix combinations than today, incorporating the destination) and
     generic neighbourhoods. Still always returns a full list — never
     empty, never throws.
2. `images`: `pickPhotos(rng, 5 + Math.floor(rng()*2))` → **5–6 photos**
   per hotel (was a single picsum URL).
3. Discount: with deterministic probability (~45% of hotels), set
   `originalPrice = round(totalPrice / (1 - savings))` where `savings`
   is a seeded value in ~0.08–0.30. Non-discounted hotels leave
   `originalPrice` undefined.
4. `ratingWord = ratingWordFor(guestRating)`.
5. A short deterministic `description` blurb is generated for the detail
   page (template assembled from city/area/amenities — pure string, no
   model call).

All other fields (stars, guestRating, reviewCount, amenities, board,
refundable, nights, pricePerNight, totalPrice, currency) keep their
current deterministic derivation.

## 2. Types (`lib/stays/types.ts`)

Additive, **optional** fields (so existing cached offers, the Duffel
mapper, and current unit-test fixtures remain valid):

```ts
originalPrice?: number; // cents — the pre-discount "was" price; absent when no discount
ratingWord?: string;    // e.g. "Fabulous" — derived from guestRating
description?: string;   // short blurb for the detail page
// images: string[] is unchanged in type, now holds 5–6 URLs
```

New pure helper (co-located, e.g. in `lib/stays/rating.ts` or alongside
schema):

```ts
ratingWordFor(score /*0..10*/): string
//  >=9.0 "Superb" | >=8.5 "Fabulous" | >=8.0 "Very good"
//      | >=7.0 "Good" | else "Pleasant"
```

Used by both `StayCard` and the detail page so the wording is identical.

## 3. UI

Chosen in mockups (browser companion): **card B**, **detail B**.

### `components/stays/StayCard.tsx` → "Polished B"

- Real photo (`stay.images[0]`), `object-cover`.
- "Great deal" ribbon overlaid top-left **only when** `originalPrice` set.
- Right column: score chip (`guestRating.toFixed(1)`) + `ratingWord` +
  `reviewCount`.
- Amenity pills: first ~4 + "+N" overflow indicator; first WiFi pill may
  show a check.
- Price block: strikethrough `originalPrice` (when present) above bold
  `totalPrice`, then `pricePerNight`/night + nights, then "View deal →".
- Green "Free cancellation" when `refundable`, else "Non-refundable".
- Uses existing `<Money cents=… />`. Stays a plain `<img>`
  (eslint-disable, matching current convention) since Unsplash is remote.

### `app/stay/[id]/page.tsx` → "Gallery + rich B"

- **Gallery grid:** large hero (`images[0]`) + up to 4 thumbnail tiles
  (`images[1..4]`); last tile shows "+N photos" when `images.length > 5`.
  Static CSS grid — no carousel JS.
- Title, stars, neighbourhood + city.
- Rating: score chip + `ratingWord` + review count.
- `description` blurb.
- "Popular amenities" pill list (all amenities).
- Room + board + cancellation policy.
- Sticky booking card (aside): date range, strikethrough `originalPrice`,
  `totalPrice`, per-night, "Free cancellation", "Reserve" → existing
  `/book/stay/[id]`.

### Light consistency pass (no behaviour change)

`StaySearchForm`, `StaysResultsSidebar`, `StaysResultsSortBar`: minor
spacing/score-chip styling alignment only.

## 4. Testing

New unit tests:
- `ratingWordFor` — boundary values for each band.
- generator: returns 5–6 photos per hotel; discounted hotels have
  `originalPrice > totalPrice`; a curated city yields a real
  neighbourhood from its set; an unknown city yields a non-empty list
  (fallback); output is deterministic across two calls with the same
  params (ids, names, photos, prices all equal).

Regression:
- Existing 20 stay unit tests pass (additive optional types).
- `tests/e2e/stay-flow.spec.ts` passes (same ids, same routes).
- `npm run build` clean; new `stays/` code lint-clean. (Pre-existing
  6 flights lint errors are untouched and out of scope.)

## 5. Scope guardrails (YAGNI)

Explicitly **not** doing: Duffel/real-API work, image carousel/lightbox
JS, real review lists, map view, room-type selection, booking-flow
changes, currency conversion. Card style A/C and detail style A/C
(rejected mockups) are not built.

## Files

New:
- `lib/stays/data/cities.ts`
- `lib/stays/data/photos.ts`
- `lib/stays/rating.ts` (or co-located `ratingWordFor`)
- unit tests for the above + generator

Modified:
- `lib/stays/mock/generator.ts`
- `lib/stays/types.ts`
- `components/stays/StayCard.tsx`
- `app/stay/[id]/page.tsx`
- minor: `StaySearchForm.tsx`, `StaysResultsSidebar.tsx`, `StaysResultsSortBar.tsx`
