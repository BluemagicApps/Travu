export function CarsResultsSkeleton() {
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
      <div className="glass h-64 rounded-2xl" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}
