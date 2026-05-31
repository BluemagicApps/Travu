import { describe, it, expect, vi, beforeEach } from "vitest";

const { searchStaysMock, generateStaysMock } = vi.hoisted(() => ({
  searchStaysMock: vi.fn(),
  generateStaysMock: vi.fn(),
}));
vi.mock("@/lib/stays/provider", () => ({
  getStayProvider: () => ({ kind: "duffel", searchStays: searchStaysMock }),
}));
vi.mock("@/lib/stays/mock/generator", () => ({ generateStays: generateStaysMock }));
vi.mock("@/lib/stays/offer-cache", () => ({ cacheStayOffers: vi.fn().mockResolvedValue(undefined) }));

import { searchStays } from "@/lib/stays/search";
import { cacheStayOffers } from "@/lib/stays/offer-cache";

const params = { destination: "Rome", checkIn: "2026-07-01", checkOut: "2026-07-03", adults: 2, rooms: 1 };
const stay = (id: string, price: number) => ({ id, totalPrice: price }) as never;

describe("searchStays", () => {
  beforeEach(() => vi.clearAllMocks());

  it("caps to cheapest 68 and caches them", async () => {
    searchStaysMock.mockResolvedValue(Array.from({ length: 100 }, (_, i) => stay(`s${i}`, 100000 - i)));
    const out = await searchStays(params);
    expect(out).toHaveLength(68);
    expect(out[0].totalPrice).toBeLessThan(out[67].totalPrice);
    expect(cacheStayOffers).toHaveBeenCalledOnce();
  });

  it("falls back to the mock generator on provider error", async () => {
    searchStaysMock.mockRejectedValue(new Error("ECONNRESET"));
    generateStaysMock.mockReturnValue([stay("m1", 5000)]);
    const out = await searchStays(params);
    expect(out).toEqual([stay("m1", 5000)]);
    expect(generateStaysMock).toHaveBeenCalledWith(params);
  });
});
