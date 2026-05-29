import { describe, it, expect, beforeEach } from "vitest";
import { getProvider, __resetProvider } from "@/lib/flights/provider";

describe("getProvider", () => {
  beforeEach(() => {
    __resetProvider();
    delete process.env.AMADEUS_CLIENT_ID;
    delete process.env.AMADEUS_CLIENT_SECRET;
  });

  it("returns the mock provider when no Amadeus keys are set", () => {
    expect(getProvider().kind).toBe("mock");
  });

  it("returns the amadeus provider when keys are set", () => {
    process.env.AMADEUS_CLIENT_ID = "id";
    process.env.AMADEUS_CLIENT_SECRET = "secret";
    __resetProvider();
    expect(getProvider().kind).toBe("amadeus");
  });
});
