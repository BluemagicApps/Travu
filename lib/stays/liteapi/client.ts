const BASE = "https://api.liteapi.travel/v3.0";

export function liteapiEnabled(): boolean {
  return Boolean(process.env.LITEAPI_KEY);
}

function headers(): HeadersInit {
  return {
    "X-API-Key": process.env.LITEAPI_KEY ?? "",
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function withTimeout(input: string, init: RequestInit, ms = 13000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** GET a LiteAPI endpoint with query params. Throws on non-2xx. */
export async function liteGet<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  const url = `${BASE}${path}${qs ? `?${qs}` : ""}`;
  const res = await withTimeout(url, { method: "GET", headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`liteapi_get_${path}_${res.status}`);
  return (await res.json()) as T;
}

/** POST a JSON body to a LiteAPI endpoint. Throws on non-2xx. */
export async function litePost<T>(path: string, body: unknown): Promise<T> {
  const res = await withTimeout(`${BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`liteapi_post_${path}_${res.status}`);
  return (await res.json()) as T;
}
