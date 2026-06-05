import { getTranslations } from "next-intl/server";
import { osmEmbedUrl, osmLinkUrl } from "@/lib/stays/detail";

/**
 * Real interactive map via an embedded OpenStreetMap (pannable/zoomable, keyless,
 * no dependency). Falls back to a static panel only if coords are missing.
 */
export async function MapView({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const t = await getTranslations("stays");
  if (!lat || !lng) {
    return (
      <div className="grid h-64 place-items-center rounded-2xl border border-border bg-surface-2 text-sm text-muted">
        {t("detail.mapUnavailable")}
      </div>
    );
  }
  return (
    <div className="max-w-full overflow-hidden rounded-2xl border border-border">
      <iframe
        title={`Map showing ${name}`}
        src={osmEmbedUrl(lat, lng)}
        loading="lazy"
        className="block h-64 w-full max-w-full"
        style={{ border: 0 }}
      />
      <div className="flex items-center justify-between bg-surface px-3 py-2 text-xs">
        <span className="text-muted">{name}</span>
        <a
          href={osmLinkUrl(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-price hover:underline"
        >
          {t("detail.viewLargerMap")}
        </a>
      </div>
    </div>
  );
}
