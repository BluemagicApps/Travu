import type { Cabin, Fare, Flight } from "./types";

export interface FarePerks {
  seatChoice: "free" | "paid" | "none";
  handBaggageKg: number;
  checkedBags: { count: number; kgEach: number };
  refundable: boolean;
  changeable: "free" | "fee" | "no";
}

export type FareId = "light" | "standard" | "flex" | "business-standard" | "business-flex";

export interface FareOption {
  id: FareId;
  name: string;
  cabin: Cabin;
  fare: Fare;
  perks: FarePerks;
  badge?: string;
}

const PERKS: Record<FareId, FarePerks> = {
  light: {
    seatChoice: "paid",
    handBaggageKg: 8,
    checkedBags: { count: 0, kgEach: 0 },
    refundable: false,
    changeable: "no",
  },
  standard: {
    seatChoice: "paid",
    handBaggageKg: 12,
    checkedBags: { count: 1, kgEach: 23 },
    refundable: false,
    changeable: "fee",
  },
  flex: {
    seatChoice: "free",
    handBaggageKg: 12,
    checkedBags: { count: 2, kgEach: 23 },
    refundable: true,
    changeable: "free",
  },
  "business-standard": {
    seatChoice: "free",
    handBaggageKg: 16,
    checkedBags: { count: 2, kgEach: 32 },
    refundable: false,
    changeable: "fee",
  },
  "business-flex": {
    seatChoice: "free",
    handBaggageKg: 16,
    checkedBags: { count: 2, kgEach: 32 },
    refundable: true,
    changeable: "free",
  },
};

function scaleFare(base: Fare, mult: number): Fare {
  const newBase = Math.max(0, Math.round(base.base * mult));
  const taxes = Math.round(newBase * 0.18);
  const fees = base.fees;
  return { base: newBase, taxes, fees, total: newBase + taxes + fees };
}

/** Deterministic fare bundles for a generated flight. */
export function fareOptionsFor(flight: Flight): FareOption[] {
  const economyBase: Fare =
    flight.cabin === "ECONOMY" ? flight.fare : scaleFare(flight.fare, 1 / 3.5);

  const make = (id: FareId, name: string, cabin: Cabin, mult: number, badge?: string): FareOption => ({
    id,
    name,
    cabin,
    fare: scaleFare(economyBase, mult),
    perks: PERKS[id],
    badge,
  });

  return [
    make("light", "Light", "ECONOMY", 0.85),
    make("standard", "Standard", "ECONOMY", 1.0, "Most popular"),
    make("flex", "Flex", "ECONOMY", 1.5),
    make("business-standard", "Business Standard", "BUSINESS", 3.5),
    make("business-flex", "Business Flex", "BUSINESS", 4.5),
  ];
}

export function findFareOption(flight: Flight, id: string | null | undefined): FareOption | undefined {
  if (!id) return undefined;
  return fareOptionsFor(flight).find((o) => o.id === id);
}
