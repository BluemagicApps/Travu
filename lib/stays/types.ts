export type BoardType = "ROOM_ONLY" | "BREAKFAST" | "HALF_BOARD" | "ALL_INCLUSIVE";

export type PropertyType = "hotel" | "apartment" | "home" | "resort";
export type HostType = "Vrbo" | "Hotel brand" | "Private host";
export type TravelerType = "business" | "family" | "budget" | "adults_only";
export type DistanceMode = "walk" | "drive" | "transit";

export interface StayParams {
  /** Destination city name (resolved from the dataset). */
  destination: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children?: number;
  rooms: number;
}

/** A gallery photo with an optional caption (mock assigns captions by index). */
export interface StayPhoto {
  url: string;
  caption?: string;
}

/** A named group of amenities for the detail-page grid (e.g. "Property", "Room"). */
export interface AmenityGroup {
  group: string;
  items: string[];
}

/** Sub-scores behind the overall guest rating (each 0..10). */
export interface ReviewBreakdown {
  overall: number;
  cleanliness: number;
  staff: number;
  amenities: number;
  condition: number;
}

export interface StayReview {
  author: string;
  date: string; // YYYY-MM-DD
  score: number; // 0..10
  title?: string;
  body: string;
  tripType?: string;
}

export interface NearbyLandmark {
  name: string;
  distanceText: string; // e.g. "9 min walk"
  mode: DistanceMode;
  minutes: number;
}

export interface ThingToDo {
  name: string;
  category: string;
  distanceText: string;
}

export interface Faq {
  q: string;
  a: string;
}

/** One step on the cancellation timeline (No refund → Check-in). */
export interface CancellationTier {
  label: string;
  date?: string; // YYYY-MM-DD
  refundPct: number; // 0..100
}

export interface StayPolicies {
  checkIn: string; // e.g. "3:00 PM"
  checkOut: string; // e.g. "11:00 AM"
  children: string;
  pets: string;
  cancellationTiers: CancellationTier[];
}

export interface Stay {
  id: string;
  name: string;
  city: string;
  area: string; // neighbourhood / district
  lat: number;
  lng: number;
  starRating: number; // 1..5 (hotel class)
  guestRating: number; // 0..10 (review score)
  reviewCount: number;
  images: string[]; // flat URL list (5–6 curated photos for the gallery)
  originalPrice?: number; // cents — pre-discount "was" price; absent when no discount
  ratingWord?: string; // e.g. "Fabulous" — derived from guestRating
  description?: string; // short blurb for the detail page
  amenities: string[]; // e.g. ["wifi","pool","parking"]
  roomName: string;
  boardType: BoardType;
  refundable: boolean;
  cancellationPolicy: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  pricePerNight: number; // cents
  totalPrice: number; // cents (pricePerNight * nights * rooms)
  currency: string; // ISO code, e.g. "USD"

  // ── Rich fields (optional so older cached payloads + Duffel-without-fields still parse) ──
  propertyType?: PropertyType;
  hostName?: string;
  hostType?: HostType;
  brand?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  sleeps?: number;
  beds?: number;
  photos?: StayPhoto[]; // captioned gallery (parallels images[])
  amenityGroups?: AmenityGroup[];
  roomViews?: string[];
  reviewBreakdown?: ReviewBreakdown;
  reviews?: StayReview[];
  nearbyLandmarks?: NearbyLandmark[];
  thingsToDo?: ThingToDo[];
  faqs?: Faq[];
  policies?: StayPolicies;
  vipAccess?: boolean;
  payLater?: boolean;
  beachAccess?: boolean;
  available?: boolean;
  travelerTypes?: TravelerType[];
  mealPlans?: string[];
  /** Superset tags for the "Popular filters" group (derived from other fields). */
  popularTags?: string[];
}
