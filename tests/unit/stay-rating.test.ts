import { describe, it, expect } from "vitest";
import { ratingWordFor } from "@/lib/stays/rating";

describe("ratingWordFor", () => {
  it("maps each band to its word", () => {
    expect(ratingWordFor(9.4)).toBe("Superb");
    expect(ratingWordFor(9.0)).toBe("Superb");
    expect(ratingWordFor(8.7)).toBe("Fabulous");
    expect(ratingWordFor(8.5)).toBe("Fabulous");
    expect(ratingWordFor(8.2)).toBe("Very good");
    expect(ratingWordFor(8.0)).toBe("Very good");
    expect(ratingWordFor(7.5)).toBe("Good");
    expect(ratingWordFor(7.0)).toBe("Good");
    expect(ratingWordFor(6.9)).toBe("Pleasant");
    expect(ratingWordFor(0)).toBe("Pleasant");
  });
});
