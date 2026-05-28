const pad = (n: number) => String(n).padStart(2, "0");

/** Build a timezone-naive ISO timestamp on a given date (YYYY-MM-DD). */
export function naiveIso(date: string, hour: number, minute: number): string {
  return `${date}T${pad(hour)}:${pad(minute)}:00`;
}

/** Add minutes to a naive ISO timestamp, returning a naive ISO timestamp. */
export function addMinutes(naive: string, minutes: number): string {
  const d = new Date(naive + "Z");
  return new Date(d.getTime() + minutes * 60000).toISOString().slice(0, 19);
}

/** "HH:MM" clock portion of a naive ISO timestamp. */
export function hhmm(naive: string): string {
  return naive.slice(11, 16);
}

/** Hour (0-23) of a naive ISO timestamp. */
export function hourOf(naive: string): number {
  return Number(naive.slice(11, 13));
}

export function datePart(naive: string): string {
  return naive.slice(0, 10);
}

export function dayDiff(fromDate: string, toDate: string): number {
  return Math.round(
    (Date.parse(toDate + "T00:00:00Z") - Date.parse(fromDate + "T00:00:00Z")) / 86400000,
  );
}

/** Add (or subtract) days to a YYYY-MM-DD date, returning YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  return new Date(d.getTime() + days * 86400000).toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysFromToday(date: string): number {
  return dayDiff(todayIso(), date);
}

/** Human duration, e.g. 453 -> "7h 33m". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${pad(m)}m`;
}
