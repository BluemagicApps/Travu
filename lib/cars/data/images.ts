// Curated, keyless Unsplash CDN car images (direct images.unsplash.com — no
// rate limit), grouped loosely by body style so the mock generator can show an
// on-brand photo per class. Replaced by real vendor images when a
// CARS_RAPIDAPI_KEY is configured.
const W = "w=640&q=70";

export type ImageGroup = "small" | "sedan" | "suv" | "van";

export const CAR_IMAGE_POOL: Record<ImageGroup, readonly string[]> = {
  small: [
    `https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?${W}`,
    `https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?${W}`,
    `https://images.unsplash.com/photo-1502877338535-766e1452684a?${W}`,
    `https://images.unsplash.com/photo-1511919884226-fd3cad34687c?${W}`,
  ],
  sedan: [
    `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?${W}`,
    `https://images.unsplash.com/photo-1503376780353-7e6692767b70?${W}`,
    `https://images.unsplash.com/photo-1494976388531-d1058494cdd8?${W}`,
    `https://images.unsplash.com/photo-1549924231-f129b911e442?${W}`,
    `https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?${W}`,
  ],
  suv: [
    `https://images.unsplash.com/photo-1568844293986-8d0400bd4745?${W}`,
    `https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?${W}`,
    `https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?${W}`,
    `https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?${W}`,
  ],
  van: [
    `https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?${W}`,
    `https://images.unsplash.com/photo-1612825173281-9a193378527e?${W}`,
    `https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?${W}`,
  ],
} as const;

/**
 * Pick `count` distinct image URLs from a body-style group, deterministic for a
 * given rng sequence. Falls back to repeating the group if it is smaller than
 * `count` (gallery padding) so callers always get `count` entries.
 */
export function pickCarImages(rng: () => number, group: ImageGroup, count: number): string[] {
  const pool = [...CAR_IMAGE_POOL[group]].sort(() => rng() - 0.5);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pool[i % pool.length]);
  return out;
}
