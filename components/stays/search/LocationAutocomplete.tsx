"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Plane, Building2, Landmark, Search } from "lucide-react";
import type { LocationKind, LocationSuggestion } from "@/lib/stays/data/locations";

const KIND_ICON: Record<LocationKind, typeof MapPin> = {
  city: MapPin,
  airport: Plane,
  area: Building2,
  landmark: Landmark,
};

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Where to?",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<LocationSuggestion[]>([]);
  const [active, setActive] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Debounced fetch when the typed value changes (250ms).
  useEffect(() => {
    const q = value.trim();
    if (q.length < 1) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stay-locations?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = await res.json();
        setResults(data.results ?? []);
        setActive(-1);
      } catch {
        /* aborted or offline — keep last results */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function choose(s: LocationSuggestion) {
    onChange(s.cityKey);
    setOpen(false);
    setResults([]);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <span className="mb-1 block text-xs font-medium text-muted">Where to?</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 focus-within:border-sky-400">
        <MapPin className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-80 w-full min-w-[280px] overflow-auto rounded-xl border border-border bg-surface py-1 shadow-xl"
        >
          {results.map((s, i) => {
            const Icon = KIND_ICON[s.kind] ?? Search;
            return (
              <li key={s.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(s)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                    i === active ? "bg-surface-2" : ""
                  }`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{s.primary}</span>
                    <span className="block truncate text-xs text-muted">{s.secondary}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
