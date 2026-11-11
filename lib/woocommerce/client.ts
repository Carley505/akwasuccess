import "server-only";
import crypto from "node:crypto";

const DEFAULT_WOO_SUBDOMAIN_URL = "https://darkgrey-lemur-121864.hostingersite.com";
const FALLBACK_WOO_URLS = [
  "https://darkgrey-lemur-121864.hostingersite.com",
  "https://cms.akwasuccess.com",
  "https://akwasuccess.com",
];

export function getWooBaseUrl(): string {
  const raw = (process.env.WOOCOMMERCE_URL || DEFAULT_WOO_SUBDOMAIN_URL).trim();
  return raw.replace(/\/+$/, "");
}

export function getWooGraphQLUrl(): string {
  if (process.env.WOOCOMMERCE_GRAPHQL_URL) {
    return process.env.WOOCOMMERCE_GRAPHQL_URL.trim();
  }
  return `${getWooBaseUrl()}/graphql`;
}

export function isWooCommerceConfigured(): boolean {
  return Boolean(
    process.env.WOOCOMMERCE_CONSUMER_KEY && process.env.WOOCOMMERCE_CONSUMER_SECRET,
  );
}

function getBasicAuthHeader(): string {
  const key = (process.env.WOOCOMMERCE_CONSUMER_KEY ?? "").trim();
  const secret = (process.env.WOOCOMMERCE_CONSUMER_SECRET ?? "").trim();
  if (!key || !secret) {
    throw new Error("WooCommerce API credentials are not configured.");
  }
  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

function getAlternateWooUrls(urlStr: string): string[] {
  const matchedBase = FALLBACK_WOO_URLS.find((base) => urlStr.startsWith(base));
  if (!matchedBase) return [];
  return FALLBACK_WOO_URLS.filter((base) => base !== matchedBase).map((base) =>
    urlStr.replace(matchedBase, base),
  );
}

async function fetchWithSubdomainFallback(
  urlStr: string,
  init: RequestInit,
): Promise<Response> {
  const alternates = getAlternateWooUrls(urlStr);
  try {
    const res = await fetch(urlStr, init);
    if (res.status === 404 && alternates.length > 0) {
      for (const alt of alternates) {
        try {
          const altRes = await fetch(alt, init);
          if (altRes.status !== 404) return altRes;
        } catch {
          // try next alternate
        }
      }
    }
    return res;
  } catch (err) {
    for (const alt of alternates) {
      try {
        return await fetch(alt, init);
      } catch {
        // try next alternate
      }
    }
    throw err;
  }
}

export async function wooRest<T>(
  endpoint: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const cleanPath = endpoint.replace(/^\/+/, "");
  const url = `${getWooBaseUrl()}/wp-json/wc/v3/${cleanPath}`;
  const timeoutMs = init?.timeoutMs ?? 12_000;

  const res = await fetchWithSubdomainFallback(url, {
    ...init,
    headers: {
      authorization: getBasicAuthHeader(),
      "content-type": "application/json",
      "user-agent": "Akwasuccess-Headless/1.0",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WooCommerce REST error (${res.status}) on ${cleanPath}: ${text.slice(0, 200)}`);
  }

  return (await res.json()) as T;
}

export async function wooGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  timeoutMs = 10_000,
): Promise<T | null> {
  try {
    const res = await fetchWithSubdomainFallback(getWooGraphQLUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Akwasuccess-Headless/1.0",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T; errors?: unknown[] };
    return json.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetches a downloadable file from WooCommerce on the server so the WordPress
 * download URL is never exposed to the browser.
 */
export async function fetchWooDownloadBytes(opts: {
  wooProductId: number;
  downloadId: string;
  wooOrderKey?: string | null;
  buyerEmail: string;
  directFileUrl?: string | null;
}): Promise<Uint8Array | null> {
  const base = getWooBaseUrl();

  // 1. Try WooCommerce's native download permission endpoint (?download_file=...)
  if (opts.wooOrderKey) {
    const uid = crypto
      .createHash("sha256")
      .update(opts.buyerEmail.trim().toLowerCase())
      .digest("hex");
    const candidates = [
      `${base}/?download_file=${opts.wooProductId}&order=${encodeURIComponent(opts.wooOrderKey)}&uid=${uid}&key=${encodeURIComponent(opts.downloadId)}`,
      `${base}/?download_file=${opts.wooProductId}&order=${encodeURIComponent(opts.wooOrderKey)}&email=${encodeURIComponent(opts.buyerEmail.trim())}&key=${encodeURIComponent(opts.downloadId)}`,
    ];

    for (const candidate of candidates) {
      try {
        const res = await fetchWithSubdomainFallback(candidate, {
          headers: { "user-agent": "Akwasuccess-Headless/1.0" },
          redirect: "follow",
          cache: "no-store",
          signal: AbortSignal.timeout(15_000),
        });
        const ct = (res.headers.get("content-type") ?? "").toLowerCase();
        if (res.ok && !ct.includes("text/html")) {
          const buf = new Uint8Array(await res.arrayBuffer());
          if (buf.byteLength > 256) return buf;
        }
      } catch {
        // try next candidate
      }
    }
  }

  // 2. Try fetching the file URL directly if accessible (e.g., standard wp-content/uploads)
  if (opts.directFileUrl) {
    const httpsUrl = opts.directFileUrl.replace(/^http:\/\//i, "https://");
    try {
      const headers: Record<string, string> = { "user-agent": "Akwasuccess-Headless/1.0" };
      if (isWooCommerceConfigured()) {
        headers.authorization = getBasicAuthHeader();
      }
      const res = await fetchWithSubdomainFallback(httpsUrl, {
        headers,
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      const ct = (res.headers.get("content-type") ?? "").toLowerCase();
      if (res.ok && !ct.includes("text/html")) {
        const buf = new Uint8Array(await res.arrayBuffer());
        if (buf.byteLength > 256) return buf;
      }
    } catch {
      // fall through
    }
  }

  return null;
}
