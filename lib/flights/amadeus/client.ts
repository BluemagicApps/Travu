let cachedToken: { value: string; expiresAt: number } | null = null;

export function __resetTokenCache(): void {
  cachedToken = null;
}

export function amadeusBaseUrl(): string {
  return process.env.AMADEUS_BASE_URL ?? "https://test.api.amadeus.com";
}

export function hasAmadeusKeys(): boolean {
  return Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
}

export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) return cachedToken.value;

  const id = process.env.AMADEUS_CLIENT_ID;
  const secret = process.env.AMADEUS_CLIENT_SECRET;
  if (!id || !secret) throw new Error("amadeus_missing_credentials");

  const res = await fetch(`${amadeusBaseUrl()}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: id,
      client_secret: secret,
    }),
  });
  if (!res.ok) throw new Error(`amadeus_auth_failed_${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  const expiresIn = Number(json.expires_in) || 1799;
  cachedToken = { value: json.access_token, expiresAt: now + expiresIn * 1000 };
  return cachedToken.value;
}

type QueryParams = Record<string, string | number | boolean | undefined>;

/** Authenticated GET returning parsed JSON. Throws on non-2xx. */
export async function amadeusGet<T>(path: string, query: QueryParams): Promise<T> {
  const token = await getAccessToken();
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined) qs.set(k, String(v));
  const res = await fetch(`${amadeusBaseUrl()}${path}?${qs.toString()}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`amadeus_get_failed_${res.status}_${path}`);
  return (await res.json()) as T;
}
