import { describe, it, expect, vi, beforeEach } from "vitest";
import { __resetTokenCache, getAccessToken } from "@/lib/flights/amadeus/client";

describe("amadeus client token cache", () => {
  beforeEach(() => {
    __resetTokenCache();
    process.env.AMADEUS_CLIENT_ID = "id";
    process.env.AMADEUS_CLIENT_SECRET = "secret";
    process.env.AMADEUS_BASE_URL = "https://test.api.amadeus.com";
  });

  it("fetches a token once and reuses it until near expiry", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "tok123", expires_in: 1800 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const a = await getAccessToken();
    const b = await getAccessToken();

    expect(a).toBe("tok123");
    expect(b).toBe("tok123");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
