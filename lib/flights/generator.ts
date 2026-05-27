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
function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

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

  const flights: Flight[] = [];
  let idx = 0;

  const nonstopAirlines = unique(
    ds.routes
      .filter((r) => r.originIata === origin && r.destIata === dest)
      .map((r) => r.airlineIata),
  );

  for (const al of nonstopAirlines) {
    const count = 1 + Math.floor(rand() * 2);
    for (let k = 0; k < count; k++) {
      flights.push(buildNonstop(idx++, al, origin, dest, totalDist, ctx));
    }
  }

  if (flights.length < 6 || totalDist > 4000) {
    const used = new Set<string>();
    const leg1s = ds.routes.filter(
      (r) => r.originIata === origin && r.destIata !== dest && r.destIata !== origin,
    );
    for (const leg1 of leg1s) {
      if (flights.length >= 12) break;
      const hub = leg1.destIata;
      const key = `${leg1.airlineIata}:${hub}`;
      if (used.has(key)) continue;
      const leg2 = ds.routes.find(
        (r) =>
          r.airlineIata === leg1.airlineIata && r.originIata === hub && r.destIata === dest,
      );
      if (!leg2 || !ds.airports.get(hub)) continue;
      used.add(key);
      flights.push(buildConnection(idx++, leg1.airlineIata, origin, hub, dest, ctx));
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
