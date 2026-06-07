# Phase F — Visual & Design Overhaul (Apple-grade polish)

**Date:** 2026-06-07
**Branch:** `feat/phase-f-visual-polish`
**Status:** Approved (brainstorming) — pending implementation plan

## One-line

Keep TRAVU's existing sky-blue → indigo palette exactly as-is; elevate the
*execution* to Apple-grade polish across the shared foundation, the home page,
and the three results pages. **No new colours, no new fonts, no behaviour
changes — purely visual.**

## Background & decision trail

Phase F was the one planned overhaul phase left undone (the open-ended
visual/polish pass). During brainstorming we converged through eight rejected
mockup directions to a precise brief:

- **Goal:** premium & distinctive feel (not a cohesion pass, not a rebrand).
- **Reference the user loves:** Apple — stark, cinematic, huge confident type,
  generous whitespace, restraint.
- **Hard constraint from the user:** *keep the current sky-blue theme.* The
  premium feel must come from execution, not a palette change.
- **Approved proof:** an "Apple-elevated" mockup of the home hero using the
  identical current palette (`#0ea5e9 → #818cf8` accent, `#f4f8fc` surface,
  `#0f172a` ink) — confirmed as the direction.
- **Scope:** Foundation + Home + Search/results pages (flights / stays / cars).

The existing design system is already mature (themed CSS custom properties for
light/dark, layered elevation shadows, gradient accent buttons with press
feedback, glass surfaces, card-lift hover, `reveal` animation, focus rings,
reduced-motion handling). Phase F is therefore an **elevation and cohesion**
pass on a solid foundation, not a teardown.

## Design principles ("Apple discipline")

1. **Typography** — keep Geist Sans (already loaded, clean, modern). Adopt a
   deliberate scale:
   - Hero headlines much larger and tighter: ~`text-6xl/7xl`,
     `tracking-[-0.04em]`, `font-extrabold`.
   - Section headings ~`text-3xl/4xl`, tight tracking.
   - Body text with generous line-height.
   - Confidence through size and spacing, not decoration.
2. **Whitespace** — roughly double the vertical rhythm. Sections breathe
   (`py-24` → `py-32` on desktop, scaled down on mobile). One consistent
   spacing scale across all touched surfaces.
3. **Restraint** — the accent gradient is used *sparingly*: primary CTAs, one
   hero word, key prices. Everything else is ink/muted so the blue pops.
4. **Motion** — refine the existing `reveal` into tasteful on-scroll entrances
   (IntersectionObserver). Keep tactile press feedback. Fully respect
   `prefers-reduced-motion` (already handled globally; new motion must honour
   it too). No gratuitous animation.
5. **Surfaces** — the refined single-object search bar (segmented
   Flights/Stays/Cars toggle + "Where to?" + one accent Search button), as
   shown in the approved mockup. Consistent radii. Keep the existing layered
   shadows.

## Architecture / approach

**Systemic-first.** Most of the "Apple discipline" lives in shared primitives,
so refining those propagates polish to pages we never touch directly. Order of
work: foundation → home → results pages.

### Units of work

1. **Foundation (shared, propagates everywhere)**
   - `app/globals.css` — add a small type-scale / spacing helper set and a
     reusable scroll-reveal utility (CSS side). Keep all existing tokens and
     utilities; this is additive + refinement, not replacement.
   - New reusable `<Reveal>` client component — an IntersectionObserver wrapper
     for on-scroll entrance animation, honouring `prefers-reduced-motion`. One
     clear purpose; used by home bands and results sections.
   - Refine shared components: **Navbar** (more whitespace, cleaner),
     **search bar** (`HomeSearch` / `AiSearchBar` → the refined object),
     **buttons** (`.btn-accent` already solid; confirm consistency), **footer**
     spacing.

2. **Home page (bespoke)** — `app/page.tsx` + `components/home/*`
   - Elevated hero (approved): eyebrow pill, oversized tight headline with one
     gradient word, refined search object, "Popular:" chips, accent bloom.
   - Re-rhythm content bands (`FlightDealsBand`, `PromoBanner`, `ValueProps`,
     `StayLikeALocal`, `TravelStyles`, `ExploreWorld`) with the new spacing
     scale + scroll reveals + restrained accent usage.

3. **Search & results pages (bespoke visual only)** — flights/stays/cars
   - Cleaner result cards, consistent spacing, refined sort/filter bar, sharper
     typographic hierarchy on price & route, generous whitespace, refined
     loading skeletons.
   - Components in scope: `components/flights/ResultsView.tsx`,
     `FlightResultsList.tsx`, `FlightCard.tsx`, `ResultsSortBar.tsx`,
     `ResultsSidebar.tsx`, `ResultsSkeleton.tsx`; `components/cars/*` results
     (`CarResultsView`, `CarCard`, `CarsResultsSkeleton`); stays results
     (`components/stays/StayResultsView.tsx`, `StayCard.tsx`,
     `StaysResultsSkeleton.tsx`). **Functionality stays byte-for-byte identical
     — visual only.**

## Data flow / behaviour

No data-flow changes. No API, route, props-contract, or state changes. All work
is presentational (className/markup/CSS) plus the additive `<Reveal>` wrapper.
Provider data, prices, dates, i18n keys, and booking logic are untouched.

## Error handling

N/A — no new logic paths. Existing loading/empty/error states are restyled, not
re-architected; their conditions and copy stay the same.

## Non-goals (explicitly out of scope)

- No palette change.
- No font change (keep Geist).
- No copy / content / i18n-key rewrites.
- **No functional or behavioural changes of any kind.**
- Not bespoke-touched (inherit systemic primitives only): booking flow
  internals, detail pages, dashboard, admin, OneToken, content/legal pages,
  auth pages.

## Testing & verification

Same bar as prior overhaul phases:

- `tsc` (typecheck) green.
- `eslint` green.
- All existing **186 vitest** tests pass (no behaviour change ⇒ no new tests
  required; existing tests guard against regressions).
- `next build` succeeds.
- Manual visual check in **light + dark + mobile** for home and the three
  results pages.

## Risks & mitigations

- **Risk:** spacing/type changes ripple into untouched pages via shared
  components in ways that look off. **Mitigation:** make foundation changes
  additive (new utilities / refined components) and visually check a sampling
  of inheriting pages (e.g. a booking page, a content page) in light + dark.
- **Risk:** scope creep into "while I'm here" rewrites. **Mitigation:** the
  non-goals list is binding; anything outside it is a separate follow-up.
