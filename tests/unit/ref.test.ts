import { describe, it, expect } from "vitest";
import { makeRef } from "@/lib/utils/ref";

describe("makeRef", () => {
  it("matches the TRV-XXXXXX format", () => {
    expect(makeRef()).toMatch(/^TRV-[A-Z0-9]{6}$/);
  });

  it("avoids ambiguous characters", () => {
    for (let i = 0; i < 200; i++) {
      expect(makeRef()).not.toMatch(/[ILO01]/);
    }
  });

  it("is effectively unique across many calls", () => {
    const refs = new Set(Array.from({ length: 2000 }, () => makeRef()));
    expect(refs.size).toBeGreaterThan(1990);
  });
});
