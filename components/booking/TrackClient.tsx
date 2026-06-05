"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Search, PlaneTakeoff } from "lucide-react";
import { TrackTimeline } from "./TrackTimeline";
import { hhmm, datePart, formatDuration } from "@/lib/utils/dates";
import type { StatusInfo, StatusPhase } from "@/lib/booking/status";

interface Segment {
  airlineIata: string;
  airlineName: string;
  flightNo: string;
  originIata: string;
  destIata: string;
  departIso: string;
  arriveIso: string;
  durationMin: number;
}

interface FlightLite {
  carrierIata: string;
  carrierName: string;
  carrierColor: string;
  flightNo: string;
  cabin: string;
  stops: number;
  durationMin: number;
  departIso: string;
  arriveIso: string;
  segments: Segment[];
}

interface TrackResponse {
  ref: string;
  tripType: string;
  fareName?: string;
  status: StatusInfo;
  flight: FlightLite;
  travellers: string[];
}

const field =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-sky-400";

export function TrackClient() {
  const t = useTranslations("track");
  const sp = useSearchParams();
  const initialRef = (sp.get("ref") ?? "").toUpperCase();
  const [ref, setRef] = useState(initialRef);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackResponse | null>(null);

  async function lookup(value: string) {
    const v = value.trim().toUpperCase();
    if (!/^TRV-[A-Z0-9]{6}$/.test(v)) {
      setError(t("invalidRef"));
      setData(null);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref: v }),
      });
      if (res.status === 404) {
        setData(null);
        setError(t("notFound", { ref: v }));
        return;
      }
      if (!res.ok) {
        setData(null);
        setError(t("lookupError"));
        return;
      }
      const json = (await res.json()) as TrackResponse;
      setData(json);
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialRef) void lookup(initialRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRef]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    void lookup(ref);
  }

  return (
    <div>
      <form onSubmit={submit} className="mt-6 flex flex-wrap gap-2">
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value.toUpperCase())}
          placeholder={t("placeholder")}
          className={`${field} font-mono uppercase`}
          style={{ flex: "1 1 220px" }}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-accent flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {t("trackButton")}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}

      {data && (
        <div className="mt-8 space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("bookingReference")}
                </div>
                <div className="font-mono text-xl font-bold text-price">{data.ref}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("status")}
                </div>
                <div className="text-lg font-bold capitalize">
                  {data.status.phase.replace(/_/g, " ")}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <TrackTimeline phase={data.status.phase as StatusPhase} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
                style={{ background: data.flight.carrierColor }}
              >
                {data.flight.carrierIata}
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold">
                  {data.flight.segments[0].originIata} → {data.flight.segments[data.flight.segments.length - 1].destIata}
                </div>
                <div className="text-sm text-muted">
                  {hhmm(data.flight.departIso)} – {hhmm(data.flight.arriveIso)}{" "}
                  ({formatDuration(data.flight.durationMin)}) ·{" "}
                  {data.flight.stops === 0 ? t("direct") : t("stops", { count: data.flight.stops })}
                </div>
                <div className="text-sm text-muted">
                  {data.flight.carrierName} · {datePart(data.flight.departIso)}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-border pt-4">
              {data.flight.segments.map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <PlaneTakeoff className="h-3.5 w-3.5 text-muted" />
                  <span className="font-mono text-xs text-muted">
                    {s.airlineIata}
                    {s.flightNo}
                  </span>
                  <span className="font-semibold">
                    {hhmm(s.departIso)} {s.originIata}
                  </span>
                  <span className="text-muted">→</span>
                  <span className="font-semibold">
                    {hhmm(s.arriveIso)} {s.destIata}
                  </span>
                  <span className="ml-auto text-xs text-muted">{formatDuration(s.durationMin)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-border pt-3 text-sm">
              <span className="text-muted">{t("travellers")} </span>
              {data.travellers.map((t, i) => (
                <span key={i} className="font-medium">
                  {t}
                  {i < data.travellers.length - 1 ? ", " : ""}
                </span>
              ))}
              {data.fareName && (
                <span className="text-muted"> · {t("fare")} <span className="font-medium text-text">{data.fareName}</span></span>
              )}
            </div>
          </div>

          {data.status.etaIso && (
            <div className="rounded-2xl bg-surface-2 p-4 text-xs text-muted">
              {t("estimatedArrival")} <span className="font-semibold text-text">{hhmm(data.status.etaIso)} {t("onDate", { date: datePart(data.status.etaIso) })}</span>
              {data.status.nextChangeAt && (
                <>
                  {" · "}{t("nextChangeAt")} <span className="font-semibold text-text">{hhmm(data.status.nextChangeAt)} {t("onDate", { date: datePart(data.status.nextChangeAt) })}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
