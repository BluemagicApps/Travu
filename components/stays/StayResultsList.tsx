import type { Stay } from "@/lib/stays/types";
import { StayCard } from "./StayCard";

export function StayResultsList({ stays }: { stays: Stay[] }) {
  if (stays.length === 0) {
    return <p className="text-sm text-muted">No stays match your filters.</p>;
  }
  return (
    <div className="space-y-3">
      {stays.map((s) => (
        <StayCard key={s.id} stay={s} />
      ))}
    </div>
  );
}
