import { describe, it, expect, beforeEach } from "vitest";
import { getProvider, __resetProvider } from "@/lib/flights/provider";

describe("getProvider", () => {
  beforeEach(() => {
    __resetProvider();
    delete process.env.AMADEUS_CLIENT_ID;
    delete process.env.AMADEUS_CLIENT_SECRET;
    delete process.env.DUFFEL_API_TOKEN;
    delete process.env.FLIGHTS_PROVIDER;
  });

  it("defaults to the mock provider for fast, fully-populated results", () => {
    expect(getProvider().kind).toBe("mock");
  });

  it("stays on mock even when a Duffel token is present (no opt-in)", () => {
    process.env.DUFFEL_API_TOKEN = "duffel_test_x";
    __resetProvider();
    expect(getProvider().kind).toBe("mock");
  });

  it("uses duffel only when FLIGHTS_PROVIDER=duffel and a token is set", () => {
    process.env.FLIGHTS_PROVIDER = "duffel";
    process.env.DUFFEL_API_TOKEN = "duffel_test_x";
    __resetProvider();
    expect(getProvider().kind).toBe("duffel");
  });

  it("falls back to mock when FLIGHTS_PROVIDER=duffel but no token is set", () => {
    process.env.FLIGHTS_PROVIDER = "duffel";
    __resetProvider();
    expect(getProvider().kind).toBe("mock");
  });

  it("uses amadeus only when FLIGHTS_PROVIDER=amadeus and keys are set", () => {
    process.env.FLIGHTS_PROVIDER = "amadeus";
    process.env.AMADEUS_CLIENT_ID = "id";
    process.env.AMADEUS_CLIENT_SECRET = "secret";
    __resetProvider();
    expect(getProvider().kind).toBe("amadeus");
  });
});
