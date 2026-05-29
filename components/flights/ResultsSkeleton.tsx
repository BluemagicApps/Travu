import { Loader2, PlaneTakeoff } from "lucide-react";

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-surface-2" />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-surface-2" />
            <div className="h-2.5 w-16 rounded bg-surface-2" />
          </div>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <div className="h-4 w-12 rounded bg-surface-2" />
          <div className="h-px w-16 bg-surface-2" />
          <div className="h-4 w-12 rounded bg-surface-2" />
        </div>
        <div className="space-y-2 text-right">
          <div className="ml-auto h-5 w-20 rounded bg-surface-2" />
          <div className="ml-auto h-2.5 w-12 rounded bg-surface-2" />
        </div>
      </div>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block">
          <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
            <div className="h-4 w-20 rounded bg-surface-2" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-3 w-28 rounded bg-surface-2" />
                <div className="h-3 w-10 rounded bg-surface-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Results column */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted">
            <Loader2 className="h-4 w-4 animate-spin text-price" />
            <PlaneTakeoff className="h-4 w-4 text-price" />
            Searching live fares across airlines…
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
