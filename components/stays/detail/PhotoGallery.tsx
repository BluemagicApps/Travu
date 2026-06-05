"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { StayPhoto } from "@/lib/stays/types";

/** Hero + 2x2 tile gallery with a "+N photos" overlay and a lightbox. */
export function PhotoGallery({ photos, name }: { photos: StayPhoto[]; name: string }) {
  const tr = useTranslations("stays");
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  if (photos.length === 0) return null;
  const hero = photos[0];
  const tiles = photos.slice(1, 5);
  const extra = Math.max(0, photos.length - 5);

  const openAt = (i: number) => {
    setIdx(i);
    setOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:grid-rows-2">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="col-span-2 row-span-2 block h-56 overflow-hidden rounded-2xl sm:h-80"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.url} alt={hero.caption ?? name} className="h-full w-full object-cover transition hover:scale-105" />
        </button>
        {tiles.map((t, i) => {
          const isLast = i === tiles.length - 1 && extra > 0;
          return (
            <button key={t.url} type="button" onClick={() => openAt(i + 1)} className="relative hidden h-[9.5rem] overflow-hidden rounded-xl sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.url} alt={t.caption ?? `${name} photo ${i + 2}`} className="h-full w-full object-cover transition hover:scale-105" />
              {isLast && (
                <span className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-semibold text-white">
                  {tr("detail.morePhotos", { count: extra })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90" onClick={() => setOpen(false)}>
          <button type="button" aria-label="Close" className="absolute right-4 top-4 text-white" onClick={() => setOpen(false)}>
            <X className="h-7 w-7" />
          </button>
          <button
            type="button"
            aria-label="Previous"
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + photos.length) % photos.length); }}
            className="absolute left-4 text-white"
          >
            <ChevronLeft className="h-9 w-9" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[idx].url}
            alt={photos[idx].caption ?? name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
          />
          <button
            type="button"
            aria-label="Next"
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % photos.length); }}
            className="absolute right-4 text-white"
          >
            <ChevronRight className="h-9 w-9" />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
            {idx + 1} / {photos.length}{photos[idx].caption ? ` · ${photos[idx].caption}` : ""}
          </span>
        </div>
      )}
    </>
  );
}
