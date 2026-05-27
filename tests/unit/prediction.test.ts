import { describe, it, expect } from "vitest";
import { predict } from "@/lib/flights/prediction";

describe("predict", () => {
  it("predicts a rise near departure", () => {
    expect(predict({ daysToDeparture: 5 }).direction).toBe("rise");
  });

  it("is stable far out", () => {
    expect(predict({ daysToDeparture: 120 }).direction).toBe("stable");
  });

  it("is deterministic", () => {
    expect(predict({ daysToDeparture: 12 })).toEqual(predict({ daysToDeparture: 12 }));
  });

  it("returns sane ranges", () => {
    const p = predict({ daysToDeparture: 8 });
    expect(p.pct).toBeGreaterThanOrEqual(0);
    expect(p.confidence).toBeGreaterThanOrEqual(50);
    expect(p.confidence).toBeLessThanOrEqual(95);
  });
});
