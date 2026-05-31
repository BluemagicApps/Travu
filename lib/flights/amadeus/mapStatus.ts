import { statusFor } from "@/lib/booking/status";
import type { ProviderStatus } from "../provider";

interface Timing { qualifier: string; value: string }
interface FlightPoint {
  iataCode: string;
  departure?: { timings: Timing[] };
  arrival?: { timings: Timing[] };
}
interface StatusDatum { flightPoints: FlightPoint[] }
export interface AmStatusResponse { data: StatusDatum[] }

function firstTiming(points: FlightPoint[], key: "departure" | "arrival"): string | undefined {
  for (const p of points) {
    const t = p[key]?.timings?.[0]?.value;
    if (t) return t;
  }
  return undefined;
}

/** Map real scheduled times to a phase via the same time-based logic used for mock. */
export function mapStatus(resp: AmStatusResponse, now: Date = new Date()): ProviderStatus | null {
  const datum = resp.data?.[0];
  if (!datum) return null;
  const dep = firstTiming(datum.flightPoints, "departure");
  const arr = firstTiming(datum.flightPoints, "arrival");
  if (!dep || !arr) return null;
  return { status: statusFor(dep, arr, now), live: true };
}
