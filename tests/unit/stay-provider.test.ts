import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getStayProvider, __resetStayProvider } from "@/lib/stays/provider";

describe("getStayProvider", () => {
  const original = process.env.DUFFEL_API_TOKEN;
  beforeEach(() => __resetStayProvider());
  afterEach(() => {
    if (original === undefined) delete process.env.DUFFEL_API_TOKEN;
    else process.env.DUFFEL_API_TOKEN = original;
    __resetStayProvider();
  });

  it("uses mock when no Duffel token", () => {
    delete process.env.DUFFEL_API_TOKEN;
    expect(getStayProvider().kind).toBe("mock");
  });

  it("uses duffel when token present", () => {
    process.env.DUFFEL_API_TOKEN = "test_token";
    expect(getStayProvider().kind).toBe("duffel");
  });
});
