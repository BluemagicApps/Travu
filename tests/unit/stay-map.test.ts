import { describe, it, expect } from "vitest";
import fixture from "./fixtures/duffel-stays.json";
import { mapDuffelStays } from "@/lib/stays/duffel/map";

describe("mapDuffelStays", () => {
  it("maps Duffel Stays search results into Stay[]", () => {
    const stays = mapDuffelStays(fixture as never, {
      destination: "Barcelona", checkIn: "2026-07-01", checkOut: "2026-07-03", adults: 2, rooms: 1,
    });
    expect(stays).toHaveLength(1);
    const s = stays[0];
    expect(s.id).toBe("duffel_stay_res_001");
    expect(s.name).toBe("Hotel Arts Barcelona");
    expect(s.starRating).toBe(5);
    expect(s.guestRating).toBe(8.9);
    expect(s.area).toBe("Eixample");
    expect(s.amenities).toEqual(["wifi", "pool", "parking"]);
    expect(s.roomName).toBe("Deluxe King");
    expect(s.boardType).toBe("ROOM_ONLY");
    expect(s.refundable).toBe(true);
    expect(s.nights).toBe(2);
    expect(s.totalPrice).toBe(54000);
    expect(s.pricePerNight).toBe(27000);
    expect(s.currency).toBe("USD");
  });
});
