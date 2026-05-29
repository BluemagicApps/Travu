import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { __resetTokenCache, getAccessToken } from "@/lib/flights/amadeus/client";

describe("amadeus client token cache", () => {
  beforeEach(() => {
    __resetTokenCache();
    process.env.AMADEUS_CLIENT_ID = "id";
    process.env.AMADEUS_CLIENT_SECRET = "secret";
    process.env.AMADEUS_BASE_URL = "https://test.api.amadeus.com";
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("throws when credentials are missing", async () => {
    delete process.env.AMADEUS_CLIENT_ID;
    delete process.env.AMADEUS_CLIENT_SECRET;

    await expect(getAccessToken()).rejects.toThrow(/amadeus_missing_credentials/);
  });

  it("re-fetches after the token nears expiry", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(0);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "tok456", expires_in: 1800 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    // First call at t=0 — token cached with expiresAt = 1_800_000
    await getAccessToken();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Advance to inside the 60s buffer (1_800_000 - 30_000 = 1_770_000)
    nowSpy.mockReturnValue(1_770_000);

    // Second call should re-fetch because expiresAt - 60_000 (1_740_000) <= now (1_770_000)
    await getAccessToken();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
  });
});
