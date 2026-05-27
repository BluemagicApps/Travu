import { describe, it, expect } from "vitest";
import { mulberry32, seedFrom } from "@/lib/utils/rng";

describe("rng", () => {
  it("is deterministic per seed", () => {
    const a = mulberry32(seedFrom("LOS", "DXB", "2026-06-12"));
    const b = mulberry32(seedFrom("LOS", "DXB", "2026-06-12"));
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it("differs across seeds", () => {
    const a = mulberry32(seedFrom("LOS", "DXB", "2026-06-12"));
    const b = mulberry32(seedFrom("LOS", "LHR", "2026-06-12"));
    expect(a()).not.toBe(b());
  });

  it("produces values in [0,1)", () => {
    const r = mulberry32(seedFrom("x"));
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
