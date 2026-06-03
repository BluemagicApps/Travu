import { mulberry32, seedFrom } from "@/lib/utils/rng";
import { naiveIso, addMinutes, daysFromToday } from "@/lib/utils/dates";
import { haversineKm } from "./geo";
import { priceFor } from "./pricing";
import type { Cabin, Dataset, Flight, Segment } from "./types";

const KM_PER_MIN = 13;

function blockMinutes(distanceKm: number): number {
  return Math.round(distanceKm / KM_PER_MIN) + 30;
}
function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/** Deterministic Fisher-Yates shuffle (fixed rand draws → reproducible). */
function shuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Major connecting hubs used to synthesise 1-stop options for any city pair.
const HUBS = [
  "DXB", "DOH", "IST", "LHR", "CDG", "AMS", "FRA", "SIN", "ADD", "JFK",
  "ORD", "NBO", "HKG", "DEL", "CAI", "CMN", "AUH", "ICN", "JNB", "BKK",
];

export function encodeId(
  origin: string,
  dest: string,
  date: string,
  cabin: Cabin,
  idx: number,
): string {
  return Buffer.from(`${origin}|${dest}|${date}|${cabin}|${idx}`).toString("base64url");
}

export function decodeId(
  id: string,
): { origin: string; dest: string; date: string; cabin: Cabin; idx: number } | null {
  try {
    const parts = Buffer.from(id, "base64url").toString("utf8").split("|");
    if (parts.length !== 5) return null;
    const [origin, dest, date, cabin, idx] = parts;
    return { origin, dest, date, cabin: cabin as Cabin, idx: Number(idx) };
  } catch {
    return null;
  }
}

interface GenCtx {
  ds: Dataset;
  date: string;
  cabin: Cabin;
  daysToDep: number;
  rand: () => number;
}

export function generateFlights(
  params: { origin: string; dest: string; date: string; cabin: Cabin },
  ds: Dataset,
): Flight[] {
  const { origin, dest, date, cabin } = params;
  const o = ds.airports.get(origin);
  const d = ds.airports.get(dest);
  if (!o || !d || origin === dest) return [];

  const rand = mulberry32(seedFrom(origin, dest, date, cabin));
  const daysToDep = clamp(daysFromToday(date), 0, 365);
  const ctx: GenCtx = { ds, date, cabin, daysToDep, rand };
  const totalDist = haversineKm(o, d);

  // Target a large, realistic spread (150–200 results), generated deterministically
  // in-memory so search stays fast. Route-independent: carriers are drawn from the
  // global pool, so any city pair yields results (no seeded RouteServed needed).
  const target = 150 + Math.floor(rand() * 51); // 150..200
  const nonstopShare = totalDist > 12000 ? 0.3 : totalDist > 7500 ? 0.5 : 0.65;
  const nonstopTarget = Math.max(8, Math.round(target * nonstopShare));

  const allCarriers = [...ds.airlines.keys()];
  const carriers = shuffle(allCarriers, rand).slice(0, Math.min(18, allCarriers.length));
  if (carriers.length === 0) return [];

  const flights: Flight[] = [];
  let idx = 0;

  // Nonstop options: round-robin carriers; each call draws a fresh seeded departure.
  let ci = 0;
  while (flights.length < nonstopTarget) {
    flights.push(buildNonstop(idx++, carriers[ci % carriers.length], origin, dest, totalDist, ctx));
    ci++;
  }

  // 1-stop connections through plausible hubs (excluding the O&D themselves).
  const hubs = shuffle(
    HUBS.filter((h) => h !== origin && h !== dest && ds.airports.has(h)),
    rand,
  );
  if (hubs.length > 0) {
    let k = 0;
    while (flights.length < target) {
      flights.push(
        buildConnection(idx++, carriers[k % carriers.length], origin, hubs[k % hubs.length], dest, ctx),
      );
      k++;
    }
  }

  return flights;
}

function buildNonstop(
  idx: number,
  airlineIata: string,
  originIata: string,
  destIata: string,
  distance: number,
  ctx: GenCtx,
): Flight {
  const { ds, date, cabin, daysToDep, rand } = ctx;
  const airline = ds.airlines.get(airlineIata)!;
  const depHour = 5 + Math.floor(rand() * 17);
  const depMin = Math.floor(rand() * 12) * 5;
  const dur = blockMinutes(distance);
  const departIso = naiveIso(date, depHour, depMin);
  const arriveIso = addMinutes(departIso, dur);
  const flightNo = String(100 + Math.floor(rand() * 899));
  const segment: Segment = {
    airlineIata,
    airlineName: airline.name,
    flightNo,
    originIata,
    destIata,
    departIso,
    arriveIso,
    durationMin: dur,
  };
  const fare = priceFor({ distanceKm: distance, cabin, daysToDeparture: daysToDep, rand });
  return {
    id: encodeId(originIata, destIata, date, cabin, idx),
    carrierIata: airlineIata,
    carrierName: airline.name,
    carrierColor: airline.brandColor,
    flightNo,
    cabin,
    stops: 0,
    durationMin: dur,
    departIso,
    arriveIso,
    seatsLeft: 1 + Math.floor(rand() * 9),
    fare,
    segments: [segment],
  };
}

function buildConnection(
  idx: number,
  airlineIata: string,
  originIata: string,
  hubIata: string,
  destIata: string,
  ctx: GenCtx,
): Flight {
  const { ds, date, cabin, daysToDep, rand } = ctx;
  const airline = ds.airlines.get(airlineIata)!;
  const o = ds.airports.get(originIata)!;
  const h = ds.airports.get(hubIata)!;
  const d = ds.airports.get(destIata)!;
  const dist1 = haversineKm(o, h);
  const dist2 = haversineKm(h, d);
  const dur1 = blockMinutes(dist1);
  const dur2 = blockMinutes(dist2);
  const layover = 60 + Math.floor(rand() * 180);
  const depHour = 5 + Math.floor(rand() * 15);
  const depMin = Math.floor(rand() * 12) * 5;
  const dep1 = naiveIso(date, depHour, depMin);
  const arr1 = addMinutes(dep1, dur1);
  const dep2 = addMinutes(arr1, layover);
  const arr2 = addMinutes(dep2, dur2);
  const fn1 = String(100 + Math.floor(rand() * 899));
  const fn2 = String(100 + Math.floor(rand() * 899));
  const segments: Segment[] = [
    {
      airlineIata,
      airlineName: airline.name,
      flightNo: fn1,
      originIata,
      destIata: hubIata,
      departIso: dep1,
      arriveIso: arr1,
      durationMin: dur1,
    },
    {
      airlineIata,
      airlineName: airline.name,
      flightNo: fn2,
      originIata: hubIata,
      destIata,
      departIso: dep2,
      arriveIso: arr2,
      durationMin: dur2,
    },
  ];
  const totalDur = dur1 + layover + dur2;
  const full = priceFor({ distanceKm: dist1 + dist2, cabin, daysToDeparture: daysToDep, rand });
  const base = Math.round(full.base * 0.9); // connections a touch cheaper
  const taxes = Math.round(base * 0.18);
  const fare = { base, taxes, fees: full.fees, total: base + taxes + full.fees };
  return {
    id: encodeId(originIata, destIata, date, cabin, idx),
    carrierIata: airlineIata,
    carrierName: airline.name,
    carrierColor: airline.brandColor,
    flightNo: fn1,
    cabin,
    stops: 1,
    durationMin: totalDur,
    departIso: dep1,
    arriveIso: arr2,
    seatsLeft: 1 + Math.floor(rand() * 9),
    fare,
    segments,
  };
}
