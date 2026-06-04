import type { Car, CarClass, CarParams, MileagePolicy, PickupType, Transmission } from "../types";
import { rentalDays } from "../schema";
import { encodeCarId } from "../offer-id";
import { pickCarImages, type ImageGroup } from "../data/images";

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function round(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
function clampScore(n: number): number {
  return round(Math.max(0, Math.min(10, n)), 1);
}

/** Booking-site style word for a 0..10 vendor score. */
function carRatingWord(score: number): string {
  if (score >= 9.0) return "Exceptional";
  if (score >= 8.5) return "Excellent";
  if (score >= 8.0) return "Very good";
  if (score >= 7.0) return "Good";
  return "Pleasant";
}

interface ClassDef {
  carClass: CarClass;
  group: ImageGroup;
  base: number; // cents/day before location + jitter
  seats: number;
  bags: number;
  doors: number;
  models: string[];
}

// Ordered cheapest → priciest; `base` drives the price ladder.
const CLASS_TABLE: ClassDef[] = [
  { carClass: "Mini", group: "small", base: 2500, seats: 4, bags: 1, doors: 3, models: ["Fiat 500", "Toyota Aygo", "Hyundai i10", "Kia Picanto"] },
  { carClass: "Economy", group: "small", base: 3000, seats: 5, bags: 1, doors: 4, models: ["Volkswagen Polo", "Ford Fiesta", "Opel Corsa", "Renault Clio"] },
  { carClass: "Compact", group: "small", base: 3500, seats: 5, bags: 2, doors: 4, models: ["Volkswagen Golf", "Ford Focus", "Seat Leon", "Hyundai i30"] },
  { carClass: "Midsize", group: "sedan", base: 4200, seats: 5, bags: 2, doors: 4, models: ["Toyota Corolla", "Skoda Octavia", "Mazda 3", "Kia Ceed"] },
  { carClass: "Standard", group: "sedan", base: 4800, seats: 5, bags: 3, doors: 4, models: ["Volkswagen Passat", "Ford Mondeo", "Peugeot 508"] },
  { carClass: "Full-size", group: "sedan", base: 5500, seats: 5, bags: 3, doors: 4, models: ["Skoda Superb", "Volvo S60", "Toyota Camry"] },
  { carClass: "SUV", group: "suv", base: 6500, seats: 5, bags: 3, doors: 5, models: ["Nissan Qashqai", "Toyota RAV4", "Kia Sportage", "Hyundai Tucson"] },
  { carClass: "Premium", group: "sedan", base: 8500, seats: 5, bags: 3, doors: 4, models: ["BMW 5 Series", "Audi A6", "Mercedes-Benz C-Class"] },
  { carClass: "Luxury", group: "sedan", base: 12000, seats: 5, bags: 3, doors: 4, models: ["Mercedes-Benz E-Class", "BMW 7 Series", "Audi A8"] },
  { carClass: "Minivan", group: "van", base: 7000, seats: 7, bags: 4, doors: 5, models: ["Citroën C4 Picasso", "Volkswagen Touran", "Ford S-Max"] },
  { carClass: "Van", group: "van", base: 7500, seats: 9, bags: 5, doors: 4, models: ["Ford Transit", "Mercedes-Benz Vito", "Renault Trafic"] },
];

const VENDORS: { name: string; rating: number }[] = [
  { name: "Hertz", rating: 8.6 },
  { name: "Avis", rating: 8.4 },
  { name: "Budget", rating: 8.0 },
  { name: "Enterprise", rating: 8.8 },
  { name: "Europcar", rating: 7.9 },
  { name: "Sixt", rating: 8.2 },
  { name: "Alamo", rating: 8.5 },
  { name: "Dollar", rating: 7.6 },
  { name: "Thrifty", rating: 7.4 },
  { name: "National", rating: 8.7 },
];

const FEATURE_POOL = [
  "Air conditioning",
  "Bluetooth",
  "Cruise control",
  "GPS navigation",
  "Apple CarPlay",
  "Android Auto",
  "Parking sensors",
  "Reversing camera",
  "USB charging",
];

const COUNT = 54;

export function generateCars(params: CarParams): Car[] {
  const days = rentalDays(params.pickupDate, params.returnDate);
  const rng = mulberry32(hashStr(`${params.pickup}|${params.pickupDate}|${params.returnDate}`));
  // Deterministic per-location price level so different cities differ a little.
  const locFactor = 0.85 + (hashStr(params.pickup) % 50) / 100; // 0.85..1.34

  const out: Car[] = [];
  for (let i = 0; i < COUNT; i++) {
    const classDef = pick(rng, CLASS_TABLE);
    const vendor = pick(rng, VENDORS);
    const model = pick(rng, classDef.models);

    const rTrans = rng();
    const transmission: Transmission = rTrans < 0.7 ? "automatic" : "manual";
    const rMileage = rng();
    const mileage: MileagePolicy = rMileage < 0.85 ? "Unlimited" : "Limited";
    const aircon = rng() < 0.95;
    const rPickup = rng();
    const pickupType: PickupType =
      rPickup < 0.6 ? "At airport" : rPickup < 0.85 ? "Shuttle to counter" : "Meet & greet";

    const jitter = 0.9 + rng() * 0.3; // 0.9..1.2
    const pricePerDay = Math.round((classDef.base * locFactor * jitter) / 100) * 100;
    const totalPrice = pricePerDay * days;
    const hasDeal = rng() < 0.4;
    const savings = 0.08 + rng() * 0.22;
    const originalPrice = hasDeal ? Math.round(totalPrice / (1 - savings) / 100) * 100 : undefined;

    const vendorRating = clampScore(vendor.rating + (rng() - 0.5));
    const vendorRatingCount = 200 + Math.floor(rng() * 5000);

    const featureCount = 3 + Math.floor(rng() * 4);
    const features = [...FEATURE_POOL].sort(() => rng() - 0.5).slice(0, featureCount);

    const images = pickCarImages(rng, classDef.group, 4);

    const refundable = rng() > 0.3;
    const fuelPolicy = rng() < 0.7 ? "Full to full" : "Full to empty";
    const available = rng() < 0.96;

    const popularTags: string[] = [];
    if (transmission === "automatic") popularTags.push("Automatic");
    if (mileage === "Unlimited") popularTags.push("Unlimited mileage");
    if (refundable) popularTags.push("Free cancellation");
    if (aircon) popularTags.push("Air conditioning");
    if (classDef.group === "suv") popularTags.push("SUV");

    out.push({
      id: encodeCarId({
        pickup: params.pickup,
        dropoff: params.dropoff,
        pickupDate: params.pickupDate,
        returnDate: params.returnDate,
        index: i,
      }),
      vendor: vendor.name,
      vendorRating,
      vendorRatingCount,
      ratingWord: carRatingWord(vendorRating),
      carClass: classDef.carClass,
      exampleModel: `${model} or similar`,
      transmission,
      seats: classDef.seats,
      bags: classDef.bags,
      doors: classDef.doors,
      mileage,
      aircon,
      image: images[0],
      images,
      pickupType,
      pickupLocation: params.pickup,
      dropoffLocation: params.dropoff,
      pickupDate: params.pickupDate,
      returnDate: params.returnDate,
      pickupTime: params.pickupTime,
      dropoffTime: params.dropoffTime,
      rentalDays: days,
      refundable,
      cancellation: refundable
        ? "Free cancellation up to 48h before pick-up"
        : "Non-refundable",
      fuelPolicy,
      depositText: "A refundable deposit is held on the driver's card at pick-up.",
      pricePerDay,
      totalPrice,
      originalPrice,
      currency: "USD",
      features,
      popularTags,
      available,
    });
  }
  return out;
}
