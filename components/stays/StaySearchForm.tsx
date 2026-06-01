"use client";

import { StaySearchCard, type StaySearchInitial } from "./StaySearchCard";

/**
 * Thin wrapper kept for backwards compatibility (HomeSearch imports this).
 * The real UI now lives in StaySearchCard (location autocomplete + date-range
 * calendar + multi-room travelers).
 */
export type { StaySearchInitial };

export function StaySearchForm({ initial }: { initial?: StaySearchInitial }) {
  return <StaySearchCard initial={initial} />;
}
