"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface Resp<T> {
  rows: T[];
  total: number;
  page: number;
  pages: number;
}

/**
 * Generic admin list: debounced search + server pagination against a JSON
 * endpoint returning { rows, total, page, pages }. Reused for users and bookings.
 * `params` carries extra query (e.g. the bookings vertical filter).
 */
export function AdminTable<T>({
  endpoint,
  columns,
  params,
  searchPlaceholder = "Search…",
  toolbar,
}: {
  endpoint: string;
  columns: Column<T>[];
  params?: Record<string, string>;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Resp<T> | null>(null);
  const paramsKey = JSON.stringify(params ?? {});

  // Debounce the query and reset to the first page on a new search. (setState
  // happens inside the timeout callback, not synchronously in the effect body.)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let active = true;
    const sp = new URLSearchParams({
      page: String(page),
      ...(debouncedQ ? { q: debouncedQ } : {}),
      ...(params ?? {}),
    });
    fetch(`${endpoint}?${sp.toString()}`)
      .then((r) => (r.ok ? r.json() : { rows: [], total: 0, page: 1, pages: 1 }))
      .then((json) => active && setData(json));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, page, debouncedQ, paramsKey]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-400"
          />
        </label>
        {toolbar}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.header} className={`px-3 py-2.5 font-semibold ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data === null && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            )}
            {data && data.rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted">
                  No results.
                </td>
              </tr>
            )}
            {data?.rows.map((row, i) => (
              <tr key={i} className="border-t border-border hover:bg-surface-2/50">
                {columns.map((c) => (
                  <td key={c.header} className={`px-3 py-2.5 ${c.className ?? ""}`}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-muted">
          <span>
            Page {data.page} of {data.pages} · {data.total} total
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
