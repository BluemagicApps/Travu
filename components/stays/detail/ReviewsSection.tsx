import { Star } from "lucide-react";
import type { ReviewBreakdown, StayReview } from "@/lib/stays/types";
import { ratingWordFor } from "@/lib/stays/rating";

function Bar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 text-muted">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-price" style={{ width: `${(score / 10) * 100}%` }} />
      </div>
      <span className="w-8 text-right font-semibold tabular-nums">{score.toFixed(1)}</span>
    </div>
  );
}

export function ReviewsSection({
  rating,
  reviewCount,
  breakdown,
  reviews = [],
}: {
  rating: number;
  reviewCount: number;
  breakdown?: ReviewBreakdown;
  reviews?: StayReview[];
}) {
  const empty = reviews.length === 0;
  return (
    <section id="reviews" className="scroll-mt-28 border-t border-border py-6">
      <h2 className="text-lg font-bold">Guest reviews</h2>
      {empty ? (
        <div className="mt-3 rounded-2xl border border-border bg-surface-2 p-6 text-center text-sm text-muted">
          No reviews yet — be the first to review this property after your stay.
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <span className="rounded-xl bg-price px-3 py-2 text-xl font-extrabold text-white">{rating.toFixed(1)}</span>
            <div>
              <div className="font-semibold text-price">{ratingWordFor(rating)}</div>
              <div className="text-xs text-muted">{reviewCount} reviews</div>
            </div>
          </div>

          {breakdown && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Bar label="Cleanliness" score={breakdown.cleanliness} />
              <Bar label="Staff" score={breakdown.staff} />
              <Bar label="Amenities" score={breakdown.amenities} />
              <Bar label="Condition" score={breakdown.condition} />
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {reviews.map((r, i) => (
              <div key={i} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{r.author}</span>
                  <span className="flex items-center gap-1 text-sm text-price">
                    <Star className="h-3.5 w-3.5 fill-price" /> {r.score.toFixed(1)}
                  </span>
                </div>
                {r.tripType && <div className="text-[11px] text-muted">{r.tripType}</div>}
                <p className="mt-2 text-sm text-muted">{r.body}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
