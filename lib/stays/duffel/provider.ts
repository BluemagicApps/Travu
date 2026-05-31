import { mapDuffelStays, type DuffelStaysResponse } from "./map";
import type { StayProvider } from "../provider";
import type { Stay, StayParams } from "../types";

export class DuffelStayProvider implements StayProvider {
  kind = "duffel" as const;

  async searchStays(params: StayParams): Promise<Stay[]> {
    const token = process.env.DUFFEL_API_TOKEN ?? "";
    const version = process.env.DUFFEL_VERSION || "v2";
    // NOTE: confirm the exact Stays search endpoint + body against the live API.
    const url = "https://api.duffel.com/stays/search";
    const body = JSON.stringify({
      data: {
        location: { name: params.destination },
        check_in_date: params.checkIn,
        check_out_date: params.checkOut,
        rooms: params.rooms,
        guests: [
          ...Array.from({ length: params.adults }, () => ({ type: "adult" })),
          ...Array.from({ length: params.children ?? 0 }, () => ({ type: "child", age: 8 })),
        ],
      },
    });
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Duffel-Version": version,
            Authorization: `Bearer ${token}`,
          },
          body,
        });
      } catch (e) {
        lastErr = e; // network error (e.g. ECONNRESET) — retry
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      if (!res.ok) {
        const err = new Error(`duffel_stays_search_failed_${res.status}`);
        if (res.status < 500) throw err; // client error — fail fast
        lastErr = err;
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      const json = (await res.json()) as DuffelStaysResponse;
      return mapDuffelStays(json, params);
    }
    throw lastErr;
  }
}
