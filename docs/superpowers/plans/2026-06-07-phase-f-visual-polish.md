# Phase F — Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep TRAVU's sky-blue → indigo palette unchanged and elevate the *execution* to Apple-grade polish across the shared foundation, the home page, and the flights/stays/cars results pages.

**Architecture:** Systemic-first. Refine shared primitives (CSS utilities, a reusable scroll-reveal component, navbar, search bar, footer) so polish propagates everywhere; then apply bespoke treatment to the home hero/bands and the three results pages. All changes are presentational — no palette, font, copy, route, props, or behaviour changes.

**Tech Stack:** Next.js (App Router, RSC), React, TypeScript, Tailwind CSS v4 (custom CSS-variable tokens in `app/globals.css`), `next-intl`, `lucide-react`, `cn()` helper (`lib/utils/cn`).

---

## How to verify visual work (read first)

This is a **pure-visual** plan. There is no behaviour to unit-test, so the TDD "write a failing test" loop does **not** apply. Inventing assertions like "headline is 60px" would be bad test design. Instead, every task uses this verification loop:

1. **Typecheck:** `npx tsc --noEmit` → no errors.
2. **Lint:** `npm run lint` → no new errors/warnings.
3. **Regression tests:** `npm test` → all existing **186** tests still pass (proves no behaviour drift).
4. **Visual check:** with `npm run dev` running, open the affected page and confirm it in **light mode, dark mode, and a mobile width (~390px)**. The dev server should already be running; if not, start it with `npm run dev` and open http://localhost:3000.
5. **Commit** only after 1–4 pass.

`npm run build` is run once at the end (Task 11) rather than per-task (it's slow).

**Design constants to use throughout** (do not invent new palette values):

| Token | Value | Use |
|---|---|---|
| accent gradient | `var(--accent-from)`→`var(--accent-to)` (`#0ea5e9`→`#818cf8`) | CTAs, one hero word, key prices ONLY |
| ink | `text-text` (`#0f172a`) | headings, primary text |
| muted | `text-muted` (`#64748b`) | secondary text |
| surface | `bg-surface` / `bg-surface-2` | cards, insets |
| Hero headline | `text-5xl sm:text-7xl font-extrabold tracking-[-0.04em]` | home h1 |
| Section heading | `text-3xl sm:text-4xl font-bold tracking-[-0.02em]` | band titles |
| Section rhythm | `py-20 sm:py-28` | vertical spacing between bands/sections |
| Card radius | `rounded-2xl` | result cards, panels |

---

## Task 0: Confirm starting state

**Files:** none (environment check)

- [ ] **Step 1: Confirm branch and clean tree**

Run: `git branch --show-current && git status --short`
Expected: branch is `feat/phase-f-visual-polish`, working tree clean (only the committed spec present).

- [ ] **Step 2: Start the dev server (if not already running)**

Run: `npm run dev`
Expected: server on http://localhost:3000. Leave it running in the background for visual checks.

- [ ] **Step 3: Baseline green check**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: typecheck clean, lint clean, 186 tests pass. This is the baseline every later task must preserve.

---

## Task 1: Foundation — globals.css utilities (type scale, spacing, scroll-reveal)

**Files:**
- Modify: `app/globals.css` (append inside the existing `@layer utilities` block and add one keyframe)

These are **additive** utilities. Do not remove or alter existing tokens/utilities.

- [ ] **Step 1: Add the scroll-reveal utility + helpers**

In `app/globals.css`, inside the existing `@layer utilities { … }` block (right after the `.reveal` rule, before the closing brace), add:

```css
  /* On-scroll entrance: starts hidden, the <Reveal> component adds
     `.is-visible` via IntersectionObserver. Falls back to visible if JS
     never runs (the base state is overridden by the no-js safety below). */
  .reveal-on-scroll {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: opacity, transform;
  }
  .reveal-on-scroll.is-visible {
    opacity: 1;
    transform: none;
  }

  /* Apple-style measured heading tracking, reusable. */
  .tracking-display {
    letter-spacing: -0.04em;
  }
```

- [ ] **Step 2: Add a reduced-motion + no-JS safety net**

In `app/globals.css`, inside the existing `@media (prefers-reduced-motion: reduce)` block, add a rule so reveal elements are always shown when motion is reduced:

```css
  .reveal-on-scroll {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all green (CSS-only change; tests unaffected).
Visual check: home page still renders normally (no visible change yet — the utility isn't applied anywhere).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(phase-f): add scroll-reveal + display-tracking utilities"
```

---

## Task 2: Foundation — reusable `<Reveal>` component

**Files:**
- Create: `components/layout/Reveal.tsx`

One responsibility: wrap children and toggle `.is-visible` when scrolled into view. Honours reduced-motion by virtue of the CSS safety net from Task 1.

- [ ] **Step 1: Create the component**

Create `components/layout/Reveal.tsx` with exactly:

```tsx
"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Fades + lifts its children into view on scroll. Visual-only; renders the
 * given element (`as`, default <div>) so it can stand in for a section/li.
 * Honours prefers-reduced-motion via the CSS safety net in globals.css.
 */
export function Reveal({
  children,
  as: Tag = "div",
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={cn("reveal-on-scroll", visible && "is-visible", className)}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all green. Component is not yet used, so no visual change.

- [ ] **Step 3: Commit**

```bash
git add components/layout/Reveal.tsx
git commit -m "feat(phase-f): add reusable scroll Reveal component"
```

---

## Task 3: Foundation — Navbar refinement (more whitespace, calmer)

**Files:**
- Modify: `components/layout/Navbar.tsx`

Goal: more breathing room and quieter chrome. **No structural/behaviour change** — same links, same dropdown, same mobile bar.

- [ ] **Step 1: Widen and heighten the bar**

In `components/layout/Navbar.tsx`, change the desktop `<nav>` (line ~47) from:

```tsx
<nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
```
to:
```tsx
<nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:px-8">
```

- [ ] **Step 2: Soften the glass divider line**

The `glass` header already provides the bar. Leave `glass` as-is. No other change in this step.

- [ ] **Step 3: Calm the active tab pill**

In `NavItem` (line ~266), change the active classes from:

```tsx
isActive ? "bg-surface-2 text-text" : "text-muted hover:text-text",
```
to:
```tsx
isActive ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2/60 hover:text-text",
```
(adds a soft hover surface so inactive tabs feel tactile, matching Apple's quiet hover states.)

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all green.
Visual check (light + dark + mobile): navbar is taller with more side padding; tabs have a soft hover; mobile bottom bar unchanged.

- [ ] **Step 5: Commit**

```bash
git add components/layout/Navbar.tsx
git commit -m "feat(phase-f): roomier, calmer navbar"
```

---

## Task 4: Foundation — refined search bar object

**Files:**
- Modify: `components/layout/HomeSearch.tsx`

Goal: make the flights/stays toggle read as one refined object (Apple segmented control feel). Keep both tabs and both forms working identically.

- [ ] **Step 1: Refine the segmented toggle**

In `components/layout/HomeSearch.tsx`, change the toggle wrapper (line ~19) from:

```tsx
<div className="mx-auto mb-4 flex w-fit gap-1 rounded-full border border-border bg-surface-2 p-1">
```
to:
```tsx
<div className="mx-auto mb-5 flex w-fit gap-1 rounded-full border border-border bg-surface-2/70 p-1 shadow-[var(--shadow-sm)] backdrop-blur">
```

- [ ] **Step 2: Refine the inactive tab button**

In `TabBtn` (line ~56), change:

```tsx
active ? "btn-accent shadow" : "text-muted hover:text-text",
```
to:
```tsx
active ? "btn-accent shadow" : "text-muted hover:bg-surface hover:text-text",
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all green.
Visual check (light + dark + mobile): the flights/stays toggle looks like one cohesive control; switching tabs still swaps the form; AI search bar still appears under the flights form.

- [ ] **Step 4: Commit**

```bash
git add components/layout/HomeSearch.tsx
git commit -m "feat(phase-f): refine home search segmented control"
```

---

## Task 5: Foundation — footer breathing room

**Files:**
- Modify: `components/stays/landing/StaysFooter.tsx` (the global footer, rendered in `app/layout.tsx`)

Goal: increase vertical padding to match the new spacing rhythm. **Read the file first** to find its outer container, then adjust only the outer vertical padding.

- [ ] **Step 1: Inspect the footer**

Run: open `components/stays/landing/StaysFooter.tsx` and locate the outermost `<footer>`/`<div>` element and its current vertical padding classes (e.g. `py-10`, `py-12`).

- [ ] **Step 2: Increase outer vertical padding**

On that outermost element only, set the vertical padding to `py-16 sm:py-20` (replace whatever `py-*` it currently has). Do not change columns, links, or copy.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all green.
Visual check (light + dark + mobile): footer has more breathing room above/below; all links/columns unchanged.

- [ ] **Step 4: Commit**

```bash
git add components/stays/landing/StaysFooter.tsx
git commit -m "feat(phase-f): give footer more breathing room"
```

---

## Task 6: Home hero (the approved mockup)

**Files:**
- Modify: `app/page.tsx`

Goal: implement the approved elevated hero — bigger tighter headline with one gradient word, calmer eyebrow, more whitespace, "Popular:" chips. The `HomeSearch` component is reused unchanged.

- [ ] **Step 1: Replace the hero section**

In `app/page.tsx`, replace the `<section>` block (lines ~28–42) with:

```tsx
      <section className="mx-auto max-w-4xl px-4 pt-24 pb-16 text-center sm:pt-28">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted shadow-[var(--shadow-sm)]">
          <Sparkles className="h-3.5 w-3.5" /> {t("eyebrow")}
        </span>

        <h1 className="mt-7 text-5xl font-extrabold tracking-[-0.04em] sm:text-7xl">
          {t("tagline")}
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg text-muted sm:text-xl">{t("subtitle")}</p>

        <div className="mx-auto mt-10 max-w-2xl">
          <HomeSearch airports={airports} />
        </div>
      </section>
```

Notes: this keeps the same i18n keys (`t("eyebrow")`, `t("tagline")`, `t("subtitle")`) and the same `HomeSearch`. Only sizing/spacing/shadow change. The existing accent bloom `<div>` above the section stays as-is.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all green.
Visual check (light + dark + mobile): headline is noticeably larger and tighter; more whitespace around the search; nothing overflows on mobile (the global `overflow-x: clip` guards this, but confirm).

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(phase-f): elevated home hero"
```

---

## Task 7: Home content bands — rhythm + scroll reveals

**Files:**
- Modify: `app/page.tsx`
- Possibly modify each band's outer section padding: `components/home/FlightDealsBand.tsx`, `PromoBanner.tsx`, `ValueProps.tsx`, `StayLikeALocal.tsx`, `TravelStyles.tsx`, `ExploreWorld.tsx`

Goal: consistent `py-20 sm:py-28` rhythm between bands and a gentle scroll reveal as each enters view. **Wrap, don't rewrite** the bands.

- [ ] **Step 1: Wrap each band in `<Reveal>`**

In `app/page.tsx`, import Reveal and wrap each band component. Change the imports area to add:

```tsx
import { Reveal } from "@/components/layout/Reveal";
```

Change the band list (lines ~44–49) from:

```tsx
      <FlightDealsBand city={city} />
      <PromoBanner />
      <ValueProps />
      <StayLikeALocal city={city} />
      <TravelStyles />
      <ExploreWorld />
```
to:
```tsx
      <Reveal><FlightDealsBand city={city} /></Reveal>
      <Reveal><PromoBanner /></Reveal>
      <Reveal><ValueProps /></Reveal>
      <Reveal><StayLikeALocal city={city} /></Reveal>
      <Reveal><TravelStyles /></Reveal>
      <Reveal><ExploreWorld /></Reveal>
```

- [ ] **Step 2: Normalise each band's vertical rhythm**

For each of the six band components, open the file, find the outermost `<section>`/wrapper, and ensure its vertical padding is `py-20 sm:py-28`. If a band currently uses a smaller value (e.g. `py-12`, `py-16`), change only that `py-*`. If a band has no vertical padding (it's a full-bleed banner like `PromoBanner`), leave it — don't force padding onto a band that's intentionally tight. Do not touch their inner content.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all green.
Visual check (light + dark + mobile): as you scroll the home page, each band fades+lifts in once; spacing between bands is even and generous. Toggle OS "reduce motion" and reload — bands appear instantly with no animation (safety net from Task 1).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/home/
git commit -m "feat(phase-f): even rhythm + scroll reveals on home bands"
```

---

## Task 8: Flights results — visual polish

**Files (read each before editing):**
- Modify: `components/flights/ResultsView.tsx`, `FlightResultsList.tsx`, `FlightCard.tsx`, `ResultsSortBar.tsx`, `ResultsSidebar.tsx`, `ResultsSkeleton.tsx`

Goal: cleaner cards, sharper price/route hierarchy, consistent spacing and radii. **Visual only — no data, sort, filter, or props changes.**

- [ ] **Step 1: Card surface + hover**

In `FlightCard.tsx`, ensure the card's outer element uses: `rounded-2xl border border-border bg-surface` and the existing `card-hover` utility (add `card-hover` to its className if not present). Keep its internal layout.

- [ ] **Step 2: Price hierarchy**

In `FlightCard.tsx`, make the price the clear focal point: the price number uses `text-2xl font-extrabold tracking-[-0.02em] text-price`; any "from"/per-traveller label uses `text-xs text-muted`. Adjust only the price cluster's typography classes.

- [ ] **Step 3: Route/time hierarchy**

In `FlightCard.tsx` (and `FlightSegments.tsx` if the times live there), make airport codes/times `font-semibold text-text` and the duration/stops `text-xs text-muted`. Only typography classes change.

- [ ] **Step 4: Sort bar + sidebar spacing**

In `ResultsSortBar.tsx` and `ResultsSidebar.tsx`, normalise container padding to `p-4` and gaps to `gap-3`; give the panels `rounded-2xl border border-border bg-surface`. Keep all controls and handlers.

- [ ] **Step 5: List spacing**

In `FlightResultsList.tsx` / `ResultsView.tsx`, set the vertical gap between cards to `space-y-3` (or `gap-3` on a flex/grid container) and the page container to `py-6 sm:py-8`.

- [ ] **Step 6: Skeleton match**

In `ResultsSkeleton.tsx`, give skeleton cards the same `rounded-2xl` and height as the real card so the swap is seamless.

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all green (flight result tests still pass — proves data/sort untouched).
Visual check (light + dark + mobile): run a flight search; cards are cleaner with price as the clear focal point; sort/filter still work; skeleton matches card shape during load.

- [ ] **Step 8: Commit**

```bash
git add components/flights/
git commit -m "feat(phase-f): polish flight results cards + hierarchy"
```

---

## Task 9: Stays results — visual polish

**Files (read each before editing):**
- Modify: `components/stays/StayResultsView.tsx`, `StayCard.tsx`, `StaysResultsSkeleton.tsx`

Goal: same treatment as flights, applied to stays. **Visual only.**

- [ ] **Step 1: Card surface**

In `StayCard.tsx`, ensure the outer card uses `rounded-2xl border border-border bg-surface overflow-hidden` plus `card-hover`. Photos already fill the top; keep the image aspect ratio as-is.

- [ ] **Step 2: Price + name hierarchy**

In `StayCard.tsx`: hotel name `font-semibold text-text` (`text-base sm:text-lg`); price `text-xl font-extrabold text-price` with the "/ night" label `text-xs text-muted`; rating/location `text-xs text-muted`.

- [ ] **Step 3: List + skeleton**

In `StayResultsView.tsx`, set card spacing to `gap-4` and container `py-6 sm:py-8`. In `StaysResultsSkeleton.tsx`, match the new `rounded-2xl` card shape/height.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all green.
Visual check (light + dark + mobile): run a stays search; cards are clean and consistent with flights; prices pop; skeleton matches.

- [ ] **Step 5: Commit**

```bash
git add components/stays/
git commit -m "feat(phase-f): polish stay results cards + hierarchy"
```

---

## Task 10: Cars results — visual polish

**Files (read each before editing):**
- Modify: `components/cars/CarResultsView.tsx`, `CarCard.tsx`, `CarsResultsSkeleton.tsx`

Goal: same treatment, applied to cars. **Visual only.**

- [ ] **Step 1: Card surface**

In `CarCard.tsx`, ensure the outer card uses `rounded-2xl border border-border bg-surface` plus `card-hover`. Keep the car image and supplier logo placement.

- [ ] **Step 2: Price + vehicle hierarchy**

In `CarCard.tsx`: vehicle name/class `font-semibold text-text`; price `text-xl font-extrabold text-price` with "total"/"per day" label `text-xs text-muted`; supplier/features `text-xs text-muted`.

- [ ] **Step 3: List + skeleton**

In `CarResultsView.tsx`, set card spacing to `gap-4` and container `py-6 sm:py-8`. In `CarsResultsSkeleton.tsx`, match the new `rounded-2xl` shape/height.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all green.
Visual check (light + dark + mobile): run a cars search (real Priceline data); cards are consistent with flights/stays; prices pop; skeleton matches.

- [ ] **Step 5: Commit**

```bash
git add components/cars/
git commit -m "feat(phase-f): polish car results cards + hierarchy"
```

---

## Task 11: Full verification + PR

**Files:** none (verification + integration)

- [ ] **Step 1: Full green build**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: typecheck clean, lint clean, 186 tests pass, `next build` succeeds.

- [ ] **Step 2: Cross-surface visual sweep**

With `npm run dev`, walk through in **light, dark, and mobile (~390px)**:
- Home (hero + scroll reveals + even band rhythm)
- Flights results, Stays results, Cars results (clean cards, price focal point)
- A page NOT bespoke-touched that inherits foundation changes — e.g. a booking page and a content/legal page — to confirm the navbar/footer/search refinements didn't break them.
Expected: everything intact; no overflow, no broken dark-mode contrast, no layout shift.

- [ ] **Step 3: Reduced-motion check**

Enable OS "reduce motion", reload home: bands appear instantly, no reveal animation, no press-scale. Expected: honoured.

- [ ] **Step 4: Push and open PR**

```bash
git push -u origin feat/phase-f-visual-polish
gh pr create --base main --title "feat(phase-f): Apple-grade visual polish (sky-blue kept)" --body "Phase F — visual-only elevation. Keeps the existing sky-blue palette and Geist font; refines shared primitives (scroll Reveal, navbar, search bar, footer), the home hero/bands, and the flights/stays/cars results pages. No behaviour, route, props, copy, or i18n-key changes. Spec: docs/superpowers/specs/2026-06-07-phase-f-visual-polish-design.md"
```
Expected: PR opened against `main`.

---

## Self-review notes (already applied)

- **Spec coverage:** principles → Task 1 (utilities) + constants table; foundation → Tasks 1–5; home → Tasks 6–7; results → Tasks 8–10; non-goals respected (no palette/font/behaviour change; booking/dashboard/admin/onetoken/content untouched except inherited primitives); verification bar → Task 11.
- **No fake tests:** visual work verified via typecheck/lint/regression-tests/manual check, not invented assertions.
- **Type consistency:** `<Reveal>` props (`as`, `className`, `delayMs`) are used consistently in Task 7; CSS class names (`reveal-on-scroll`, `is-visible`, `tracking-display`) match between Task 1 and Task 2.
