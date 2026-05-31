// tests/unit/stay-photos.test.ts
import { describe, it, expect } from "vitest";
import { pickPhotos, PHOTO_POOL } from "@/lib/stays/data/photos";

// simple deterministic rng for testing
function rngFrom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("pickPhotos", () => {
  it("returns the requested count of distinct https urls", () => {
    const urls = pickPhotos(rngFrom(123), 6);
    expect(urls).toHaveLength(6);
    expect(new Set(urls).size).toBe(6);
    for (const u of urls) expect(u.startsWith("https://images.unsplash.com/")).toBe(true);
  });

  it("is deterministic for the same rng seed", () => {
    expect(pickPhotos(rngFrom(7), 5)).toEqual(pickPhotos(rngFrom(7), 5));
  });

  it("first photo is an exterior hero", () => {
    const urls = pickPhotos(rngFrom(42), 5);
    expect(PHOTO_POOL.exterior).toContain(urls[0]);
  });
});
