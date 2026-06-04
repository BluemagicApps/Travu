import { describe, it, expect, vi, beforeEach } from "vitest";

const { searchCarsMock, generateCarsMock } = vi.hoisted(() => ({
  searchCarsMock: vi.fn(),
  generateCarsMock: vi.fn(),
}));
vi.mock("@/lib/cars/provider", () => ({
  getCarProvider: () => ({ kind: "rapidapi", searchCars: searchCarsMock }),
}));
vi.mock("@/lib/cars/mock/generator", () => ({ generateCars: generateCarsMock }));
vi.mock("@/lib/cars/offer-cache", () => ({ cacheCarOffers: vi.fn().mockResolvedValue(undefined) }));

import { searchCars } from "@/lib/cars/search";
import { cacheCarOffers } from "@/lib/cars/offer-cache";

const params = { pickup: "Rome", dropoff: "Rome", pickupDate: "2026-07-01", returnDate: "2026-07-04" };
const car = (id: string, price: number) => ({ id, totalPrice: price }) as never;

describe("searchCars", () => {
  beforeEach(() => vi.clearAllMocks());

  it("caps to cheapest 54 and caches them", async () => {
    searchCarsMock.mockResolvedValue(Array.from({ length: 100 }, (_, i) => car(`c${i}`, 100000 - i)));
    const out = await searchCars(params);
    expect(out).toHaveLength(54);
    expect(out[0].totalPrice).toBeLessThan(out[53].totalPrice);
    expect(cacheCarOffers).toHaveBeenCalledOnce();
  });

  it("falls back to the mock generator on provider error", async () => {
    searchCarsMock.mockRejectedValue(new Error("ECONNRESET"));
    generateCarsMock.mockReturnValue([car("m1", 5000)]);
    const out = await searchCars(params);
    expect(out).toEqual([car("m1", 5000)]);
    expect(generateCarsMock).toHaveBeenCalledWith(params);
  });
});
