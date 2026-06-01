import type {
  AmenityGroup,
  BoardType,
  CancellationTier,
  Faq,
  HostType,
  NearbyLandmark,
  PropertyType,
  ReviewBreakdown,
  Stay,
  StayParams,
  StayPhoto,
  StayReview,
  ThingToDo,
  TravelerType,
} from "../types";
import { nightsBetween } from "../schema";
import { encodeStayId } from "../offer-id";
import { getCityData } from "../data/cities";
import { pickPhotos } from "../data/photos";
import { ratingWordFor } from "../rating";

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

// Fallback name parts for cities we don't curate.
const FALLBACK_PREFIXES = ["Grand", "Park", "Royal", "Plaza", "Riverside", "Central"];
const FALLBACK_SUFFIXES = ["Hotel", "Suites", "Boutique", "Residence", "Inn", "Palace"];
const FALLBACK_AREAS = ["Old Town", "City Centre", "Waterfront", "Marina", "Arts District", "Historic Quarter"];
const FALLBACK_LANDMARKS = ["City Centre", "Main Station", "Old Market", "Riverside Walk", "Cathedral", "Museum Quarter"];
const AMENITY_POOL = ["wifi", "pool", "parking", "gym", "spa", "breakfast", "bar", "ac", "pet_friendly"];
const PROPERTY_AMENITIES = new Set(["pool", "parking", "gym", "spa", "bar", "breakfast", "pet_friendly"]);
const ROOM_AMENITIES = new Set(["wifi", "ac"]);
const BOARDS: BoardType[] = ["ROOM_ONLY", "BREAKFAST", "HALF_BOARD", "ALL_INCLUSIVE"];
const ROOMS = ["Standard Double", "Deluxe King", "Junior Suite", "Twin Room", "Executive Suite"];
const BRANDS = ["Apex Hotels", "Marriott", "Hilton", "Premier Inn", "Accor", "Radisson", "IHG"];
const HOST_NAMES = ["Tech Host", "City Stays Co.", "Urban Nest", "BlueKey Homes", "Skyline Lets", "Harbour Hosts"];
const ROOM_VIEWS = ["City view", "Garden view", "Sea view", "Courtyard view", "Pool view"];
const TRAVELER_TYPES: TravelerType[] = ["business", "family", "budget", "adults_only"];
const PHOTO_CAPTIONS = ["Exterior", "Living area", "Bedroom", "Bathroom", "Lobby", "View"];
const REVIEW_AUTHORS = ["Sarah M.", "James T.", "Aisha K.", "Liam R.", "Chen W.", "Maria G.", "David P.", "Yuki S."];
const REVIEW_BODIES = [
  "Spotless and exactly as pictured. The location made everything walkable.",
  "Comfortable beds and a great host who answered quickly. Would book again.",
  "Stylish space, fast wifi, and quiet at night. Perfect for a city break.",
  "Good value for the area. Check-in was smooth and the kitchen had everything.",
  "Loved the views and the neighbourhood cafés. A real home away from home.",
  "Clean, modern, and well located near transport. Highly recommend.",
];
const REVIEW_TRIP_TYPES = ["Business trip", "Family trip", "Romantic getaway", "Solo trip", "Friends getaway"];
const COUNT = 72;

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

function buildDescription(name: string, area: string, city: string, stars: number, amenities: string[]): string {
  const hl = amenities.includes("spa")
    ? "a relaxing spa"
    : amenities.includes("pool")
      ? "an inviting pool"
      : amenities.includes("bar")
        ? "a stylish bar"
        : "comfortable rooms";
  return `Set in ${area}, ${name} is a ${stars}-star stay in the heart of ${city}, offering ${hl} and easy access to the city's main sights.`;
}

function distanceText(minutes: number, mode: NearbyLandmark["mode"]): string {
  return `${minutes} min ${mode}`;
}

function buildLandmarks(landmarks: string[], index: number): NearbyLandmark[] {
  return landmarks.slice(0, 5).map((name, k) => {
    const minutes = 3 + ((index * 4 + k * 7) % 23); // 3..25, deterministic
    const mode: NearbyLandmark["mode"] = minutes <= 12 ? "walk" : minutes <= 20 ? "transit" : "drive";
    return { name, distanceText: distanceText(minutes, mode), mode, minutes };
  });
}

function buildThingsToDo(items: { name: string; category: string }[], index: number): ThingToDo[] {
  return items.slice(0, 4).map((t, k) => {
    const minutes = 5 + ((index * 3 + k * 5) % 20);
    return { ...t, distanceText: distanceText(minutes, minutes <= 12 ? "walk" : "drive") };
  });
}

function buildFaqs(name: string, refundable: boolean): Faq[] {
  return [
    { q: `Is ${name} pet-friendly?`, a: "Pets are not permitted unless stated in the property amenities." },
    { q: `What time is check-in at ${name}?`, a: "Check-in starts at 3:00 PM." },
    { q: `What time is check-out at ${name}?`, a: "Check-out is before 11:00 AM." },
    { q: `Is ${name} refundable?`, a: refundable ? "Yes — free cancellation up to 48h before check-in." : "No — this rate is non-refundable." },
  ];
}

function buildCancellationTiers(refundable: boolean, checkIn: string): CancellationTier[] {
  if (!refundable) {
    return [{ label: "No refund", refundPct: 0 }, { label: "Check-in", date: checkIn, refundPct: 0 }];
  }
  return [
    { label: "Full refund", refundPct: 100 },
    { label: "Partial refund", refundPct: 50 },
    { label: "Check-in", date: checkIn, refundPct: 0 },
  ];
}

export function generateStays(params: StayParams): Stay[] {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  const rng = mulberry32(hashStr(`${params.destination}|${params.checkIn}|${params.checkOut}`));
  const curated = getCityData(params.destination);
  const cityName = curated?.city ?? params.destination;
  const tier = curated?.priceTier ?? 1;
  const landmarkPool = curated?.landmarks ?? FALLBACK_LANDMARKS;
  const thingsPool = curated?.thingsToDo ?? FALLBACK_LANDMARKS.map((n) => ({ name: n, category: "Sightseeing" }));

  const out: Stay[] = [];
  for (let i = 0; i < COUNT; i++) {
    // ── Existing draw order (1–16) — DO NOT REORDER: ids/prices/photos depend on it ──
    const stars = 2 + Math.floor(rng() * 4); // 2..5

    // Some curated hotelNames already lead with the city (e.g. "Bangkok Garden
    // Hotel"); strip it before prefixing so we never produce "Bangkok Bangkok …".
    const hotelName = curated ? pick(rng, curated.hotelNames) : "";
    const name = curated
      ? `${cityName} ${hotelName.startsWith(`${cityName} `) ? hotelName.slice(cityName.length + 1) : hotelName}`
      : `${pick(rng, FALLBACK_PREFIXES)} ${params.destination} ${pick(rng, FALLBACK_SUFFIXES)}`;
    const area = curated ? pick(rng, curated.neighbourhoods) : pick(rng, FALLBACK_AREAS);

    const baseRaw = 6000 + Math.floor(rng() * 22000) + stars * 3000; // cents/night
    const base = Math.round((baseRaw * tier) / 100) * 100;

    const amenityCount = 3 + Math.floor(rng() * 5);
    const amenities = [...AMENITY_POOL].sort(() => rng() - 0.5).slice(0, amenityCount);
    const board = pick(rng, BOARDS);
    const refundable = rng() > 0.35;
    const guestRating = Math.round((6.5 + rng() * 3.4) * 10) / 10; // 6.5..9.9
    const photoCount = 5 + Math.floor(rng() * 2); // 5 or 6
    // pickPhotos must consume a constant number of rng() calls so resolveStay's
    // regeneration from an id stays byte-identical to the card. Don't change its
    // rng usage without re-checking the determinism (stay-resolve) tests.
    const images = pickPhotos(rng, photoCount);

    const totalPrice = base * nights * params.rooms;
    // ~45% of stays carry a deal; savings 8%–30%, deterministic.
    const hasDeal = rng() < 0.45;
    const savings = 0.08 + rng() * 0.22;
    const originalPrice = hasDeal ? Math.round(totalPrice / (1 - savings) / 100) * 100 : undefined;
    // reviewCount + roomName kept in their original draw positions (15, 16).
    const reviewCountRaw = 80 + Math.floor(rng() * 2400);
    const roomName = pick(rng, ROOMS);

    // ── New draws (17+), appended after the existing sequence ──
    const rLatJit = rng();
    const rLngJit = rng();
    const rType = rng();
    const rBedrooms = rng();
    const rBathrooms = rng();
    const rSqft = rng();
    const rBrandGate = rng();
    const rBrandIdx = rng();
    const rHost = rng();
    const rClean = rng();
    const rStaff = rng();
    const rAmen = rng();
    const rCond = rng();
    const rReviews = rng();
    const rTraveler = rng();
    const rVip = rng();
    const rAvail = rng();
    const rBeach = rng();

    const propertyType: PropertyType =
      rType < 0.7 ? "hotel" : rType < 0.88 ? "apartment" : rType < 0.96 ? "home" : "resort";
    const isEntire = propertyType === "apartment" || propertyType === "home";
    const brand = !isEntire && rBrandGate < 0.45 ? BRANDS[Math.floor(rBrandIdx * BRANDS.length)] : undefined;
    const hostType: HostType = isEntire ? "Vrbo" : "Hotel brand";
    const hostName = isEntire ? HOST_NAMES[Math.floor(rHost * HOST_NAMES.length)] : brand ?? "Hotel brand";

    const bedrooms = isEntire ? 1 + Math.floor(rBedrooms * 3) : 1; // entire homes 1..3
    const bathrooms = 1 + Math.floor(rBathrooms * Math.max(1, Math.min(bedrooms, 2)));
    const beds = bedrooms + (rBedrooms > 0.6 ? 1 : 0);
    const sleeps = Math.max(2, bedrooms * 2);
    const sqft = 320 + Math.floor(rSqft * 900); // 320..1220

    const photos: StayPhoto[] = images.map((url, k) => ({ url, caption: PHOTO_CAPTIONS[k % PHOTO_CAPTIONS.length] }));

    const propItems = amenities.filter((a) => PROPERTY_AMENITIES.has(a));
    const roomItems = amenities.filter((a) => ROOM_AMENITIES.has(a));
    const roomViews = [ROOM_VIEWS[i % ROOM_VIEWS.length]];
    const amenityGroups: AmenityGroup[] = [
      { group: "Property", items: propItems },
      { group: "Room", items: [...roomItems, ...roomViews] },
    ].filter((g) => g.items.length > 0);

    const reviewBreakdown: ReviewBreakdown = {
      overall: guestRating,
      cleanliness: clampScore(guestRating + (rClean - 0.5)),
      staff: clampScore(guestRating + (rStaff - 0.5)),
      amenities: clampScore(guestRating + (rAmen - 0.5)),
      condition: clampScore(guestRating + (rCond - 0.5)),
    };

    // ~20% have no reviews yet (exercises the empty state); else 3–6 reviews.
    const reviewN = rReviews < 0.2 ? 0 : 3 + Math.floor(rReviews * 4);
    const reviews: StayReview[] = Array.from({ length: reviewN }, (_, k) => ({
      author: REVIEW_AUTHORS[(i * 7 + k) % REVIEW_AUTHORS.length],
      date: params.checkIn,
      score: clampScore(guestRating + ((k % 2 === 0 ? 1 : -1) * (k % 3) * 0.2)),
      body: REVIEW_BODIES[(i * 3 + k) % REVIEW_BODIES.length],
      tripType: REVIEW_TRIP_TYPES[(i + k) % REVIEW_TRIP_TYPES.length],
    }));
    const reviewCount = reviewN === 0 ? 0 : reviewCountRaw;

    const travelerTypes: TravelerType[] = [TRAVELER_TYPES[Math.floor(rTraveler * TRAVELER_TYPES.length)]];
    const mealPlans = board === "ROOM_ONLY" ? [] : board === "BREAKFAST" ? ["Breakfast included"] : board === "HALF_BOARD" ? ["Breakfast included", "Dinner included"] : ["All inclusive"];
    const vipAccess = rVip < 0.15;
    const payLater = !!brand || rBrandGate > 0.7;
    const beachAccess = amenities.includes("pool") && rBeach < 0.3;
    const available = rAvail < 0.95;

    const popularTags: string[] = [];
    if (isEntire) popularTags.push("Kitchen");
    if (amenities.includes("wifi")) popularTags.push("Wifi included");
    if (board !== "ROOM_ONLY" || amenities.includes("breakfast")) popularTags.push("Breakfast included");
    if (propertyType === "hotel" || propertyType === "resort") popularTags.push("Hotel");
    if (payLater) popularTags.push("Reserve now pay later");

    const lat = curated ? round(curated.coords.lat + (rLatJit - 0.5) * 0.08, 5) : 0;
    const lng = curated ? round(curated.coords.lng + (rLngJit - 0.5) * 0.08, 5) : 0;

    out.push({
      id: encodeStayId({
        destination: params.destination,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        rooms: params.rooms,
        index: i,
      }),
      name,
      city: cityName,
      area,
      lat,
      lng,
      starRating: stars,
      guestRating,
      ratingWord: ratingWordFor(guestRating),
      reviewCount,
      images,
      amenities,
      roomName,
      boardType: board,
      refundable,
      cancellationPolicy: refundable ? "Free cancellation up to 48h before check-in" : "Non-refundable",
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      nights,
      pricePerNight: base,
      totalPrice,
      originalPrice,
      currency: "USD",
      description: buildDescription(name, area, cityName, stars, amenities),
      // rich fields
      propertyType,
      hostName,
      hostType,
      brand,
      bedrooms,
      bathrooms,
      sqft,
      sleeps,
      beds,
      photos,
      amenityGroups,
      roomViews,
      reviewBreakdown,
      reviews,
      nearbyLandmarks: buildLandmarks(landmarkPool, i),
      thingsToDo: buildThingsToDo(thingsPool, i),
      faqs: buildFaqs(name, refundable),
      policies: {
        checkIn: "3:00 PM",
        checkOut: "11:00 AM",
        children: "Children of all ages are welcome.",
        pets: "Pets are not allowed.",
        cancellationTiers: buildCancellationTiers(refundable, params.checkIn),
      },
      vipAccess,
      payLater,
      beachAccess,
      available,
      travelerTypes,
      mealPlans,
      popularTags,
    });
  }
  return out;
}
