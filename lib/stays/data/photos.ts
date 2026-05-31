// lib/stays/data/photos.ts
// Curated, keyless Unsplash CDN image URLs (direct images.unsplash.com — no
// rate limit, unlike the deprecated source.unsplash.com redirect endpoint).
const W = "w=640&q=70";

export const PHOTO_POOL = {
  exterior: [
    `https://images.unsplash.com/photo-1566073771259-6a8506099945?${W}`,
    `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?${W}`,
    `https://images.unsplash.com/photo-1564501049412-61c2a3083791?${W}`,
    `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?${W}`,
    `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?${W}`,
    `https://images.unsplash.com/photo-1571896349842-33c89424de2d?${W}`,
    `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?${W}`,
    `https://images.unsplash.com/photo-1561501900-3701fa6a0864?${W}`,
  ],
  room: [
    `https://images.unsplash.com/photo-1611892440504-42a792e24d32?${W}`,
    `https://images.unsplash.com/photo-1631049307264-da0ec9d70304?${W}`,
    `https://images.unsplash.com/photo-1590490360182-c33d57733427?${W}`,
    `https://images.unsplash.com/photo-1618773928121-c32242e63f39?${W}`,
    `https://images.unsplash.com/photo-1566665797739-1674de7a421a?${W}`,
    `https://images.unsplash.com/photo-1582719508461-905c673771fd?${W}`,
    `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?${W}`,
    `https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?${W}`,
  ],
  lobby: [
    `https://images.unsplash.com/photo-1564507592333-c60657eea523?${W}`,
    `https://images.unsplash.com/photo-1559599189-fe84dea4eb79?${W}`,
    `https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?${W}`,
    `https://images.unsplash.com/photo-1578683010236-d716f9a3f461?${W}`,
    `https://images.unsplash.com/photo-1592229505726-40bd2e22ddc4?${W}`,
    `https://images.unsplash.com/photo-1455587734955-081b22074882?${W}`,
  ],
  amenity: [
    `https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?${W}`,
    `https://images.unsplash.com/photo-1540541338287-41700207dee6?${W}`,
    `https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?${W}`,
    `https://images.unsplash.com/photo-1578898886225-c4a4f8b8b8f1?${W}`,
    `https://images.unsplash.com/photo-1551918120-9739cb430c6d?${W}`,
    `https://images.unsplash.com/photo-1584132967334-10e028bd69f7?${W}`,
  ],
} as const;

function takeDistinct(rng: () => number, arr: readonly string[], n: number, seen: Set<string>): string[] {
  const out: string[] = [];
  const pool = arr.filter((u) => !seen.has(u));
  // deterministic shuffle via seeded sort
  const shuffled = [...pool].sort(() => rng() - 0.5);
  for (const u of shuffled) {
    if (out.length >= n) break;
    out.push(u);
    seen.add(u);
  }
  return out;
}

/**
 * Return `count` distinct image URLs (one exterior hero first, the rest
 * drawn from room/lobby/amenity), deterministic for a given rng sequence.
 */
export function pickPhotos(rng: () => number, count: number): string[] {
  const seen = new Set<string>();
  const hero = takeDistinct(rng, PHOTO_POOL.exterior, 1, seen);
  const rest = takeDistinct(
    rng,
    [...PHOTO_POOL.room, ...PHOTO_POOL.lobby, ...PHOTO_POOL.amenity],
    count - 1,
    seen,
  );
  return [...hero, ...rest];
}
