/**
 * Helpers for passing a booking's OneToken reward (points earned + any tier
 * promotion) from the booking POST response to the confirmation page via the
 * URL, so the confirmation slip can celebrate it. Kept tiny and framework-free.
 */
export interface BookingReward {
  earned?: number; // cents
  promotedTier?: string | null; // tier key the user was promoted to, if any
}

/** Build the "?earned=…&promoted=…" suffix for a confirmation URL (or ""). */
export function rewardQuery(r: BookingReward | null | undefined): string {
  if (!r) return "";
  const qs = new URLSearchParams();
  if (r.earned && r.earned > 0) qs.set("earned", String(r.earned));
  if (r.promotedTier) qs.set("promoted", r.promotedTier);
  const s = qs.toString();
  return s ? `?${s}` : "";
}
