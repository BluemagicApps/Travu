import { Plane } from "lucide-react";
import type { Segment } from "@/lib/flights/types";
import { hhmm, formatDuration } from "@/lib/utils/dates";

export function FlightSegments({ segments }: { segments: Segment[] }) {
  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      {segments.map((s, i) => (
        <div key={i}>
          <div className="flex items-center gap-3 text-sm">
            <Plane className="h-3.5 w-3.5 text-muted" />
            <span className="font-mono text-xs text-muted">
              {s.airlineIata}
              {s.flightNo}
            </span>
            <span className="font-semibold">
              {hhmm(s.departIso)} {s.originIata}
            </span>
            <span className="text-muted">→</span>
            <span className="font-semibold">
              {hhmm(s.arriveIso)} {s.destIata}
            </span>
            <span className="ml-auto text-xs text-muted">{formatDuration(s.durationMin)}</span>
          </div>
          {i < segments.length - 1 && (
            <div className="ml-6 mt-2 text-xs text-muted">Layover in {s.destIata}</div>
          )}
        </div>
      ))}
    </div>
  );
}
