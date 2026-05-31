/** Booking-site style word for a 0..10 guest score. */
export function ratingWordFor(score: number): string {
  if (score >= 9.0) return "Superb";
  if (score >= 8.5) return "Fabulous";
  if (score >= 8.0) return "Very good";
  if (score >= 7.0) return "Good";
  return "Pleasant";
}
