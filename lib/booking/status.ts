export type StatusPhase =
  | "confirmed"
  | "check_in_open"
  | "boarding"
  | "in_flight"
  | "arrived"
  | "completed";

export const STATUS_PHASES: { key: StatusPhase; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "check_in_open", label: "Check-in open" },
  { key: "boarding", label: "Boarding" },
  { key: "in_flight", label: "In flight" },
  { key: "arrived", label: "Arrived" },
  { key: "completed", label: "Completed" },
];

export interface StatusInfo {
  phase: StatusPhase;
  /** ISO timestamp when the phase is expected to change next, if known. */
  nextChangeAt?: string;
  /** Estimated arrival ISO. */
  etaIso?: string;
}

function parseIso(naive: string): number {
  // Treat bare timestamps as UTC, but respect an explicit Z or numeric offset.
  const hasZone = naive.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(naive);
  return Date.parse(hasZone ? naive : naive + "Z");
}

/** Derive a deterministic status from the flight's depart/arrive times. */
export function statusFor(
  departIso: string,
  arriveIso: string,
  now: Date = new Date(),
): StatusInfo {
  const dep = parseIso(departIso);
  const arr = parseIso(arriveIso);
  const t = now.getTime();
  const checkIn = dep - 24 * 60 * 60 * 1000;
  const boarding = dep - 45 * 60 * 1000;
  const completed = arr + 2 * 60 * 60 * 1000;

  if (t < checkIn) return { phase: "confirmed", nextChangeAt: new Date(checkIn).toISOString(), etaIso: arriveIso };
  if (t < boarding) return { phase: "check_in_open", nextChangeAt: new Date(boarding).toISOString(), etaIso: arriveIso };
  if (t < dep) return { phase: "boarding", nextChangeAt: departIso, etaIso: arriveIso };
  if (t < arr) return { phase: "in_flight", nextChangeAt: arriveIso, etaIso: arriveIso };
  if (t < completed) return { phase: "arrived", nextChangeAt: new Date(completed).toISOString(), etaIso: arriveIso };
  return { phase: "completed", etaIso: arriveIso };
}

export function phaseIndex(phase: StatusPhase): number {
  return STATUS_PHASES.findIndex((p) => p.key === phase);
}
