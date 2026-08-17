/**
 * Static-mode tRPC transport.
 *
 * On GitHub Pages there is no backend, so instead of HTTP we resolve tRPC
 * calls in-process: the same market engine the server uses runs directly in
 * the browser (it is Node-free by design), and the watchlist falls back to
 * localStorage. The UI cannot tell the difference — the DEMO FEED badge is
 * driven by the engine's own `source` flag.
 *
 * Protocol note: httpBatchLink sends batched requests —
 *   query:    GET  /api/trpc/<path>?batch=1&input={"0":{"json":...}}
 *   mutation: POST /api/trpc/<path>?batch=1  body={"0":{"json":...}}
 * and expects a JSON array of superjson-serialized envelopes back.
 */
import superjson from "superjson";
// Deliberate static-mode bridge: the engine module is browser-safe.
import { getCandles, getMarketStatus, getQuotes, scan } from "../../api/market/engine";
import { SCAN_PRESETS, type ScanFilters, type ScanSortKey } from "@contracts/market";

// ── localStorage watchlist ──────────────────────────────────────────────────

const WL_KEY = "edgehawk-watchlist";

interface LocalWatchlistItem {
  id: number;
  symbol: string;
  createdAt: Date;
}

function readWatchlist(): LocalWatchlistItem[] {
  try {
    const raw = localStorage.getItem(WL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ id: number; symbol: string; createdAt: string }>;
    return parsed.map((p) => ({ ...p, createdAt: new Date(p.createdAt) }));
  } catch {
    return [];
  }
}

function writeWatchlist(items: LocalWatchlistItem[]): void {
  try {
    localStorage.setItem(WL_KEY, JSON.stringify(items));
  } catch {
    // storage full/blocked — session-only then
  }
}

function watchlistList() {
  return { items: readWatchlist(), persisted: false };
}

function watchlistAdd(input: { symbol: string }) {
  const sym = input.symbol.toUpperCase().trim();
  const items = readWatchlist();
  if (!items.some((i) => i.symbol === sym)) {
    items.unshift({ id: Date.now(), symbol: sym, createdAt: new Date() });
    writeWatchlist(items);
  }
  return { items, persisted: false };
}

function watchlistRemove(input: { symbol: string }) {
  const sym = input.symbol.toUpperCase().trim();
  const items = readWatchlist().filter((i) => i.symbol !== sym);
  writeWatchlist(items);
  return { items, persisted: false };
}

// ── procedure dispatch ──────────────────────────────────────────────────────

async function dispatch(path: string, input: unknown): Promise<unknown> {
  switch (path) {
    case "ping":
      return { ok: true, ts: Date.now() };
    case "market.status": {
      const { source } = await getQuotes(["AAPL"]);
      return getMarketStatus(source);
    }
    case "market.quotes": {
      const i = (input ?? {}) as { symbols?: string[] };
      const { quotes, source } = await getQuotes(i.symbols);
      return { quotes, source, ts: Date.now() };
    }
    case "market.scan": {
      const i = input as { filters: ScanFilters; sort?: ScanSortKey; limit?: number };
      const result = await scan(i.filters, i.sort ?? "score", i.limit ?? 50);
      return { ...result, ts: Date.now() };
    }
    case "market.presets":
      return SCAN_PRESETS;
    case "market.candles": {
      const i = input as { symbol: string; range?: string };
      const { candles, source } = await getCandles(i.symbol, i.range ?? "1d");
      return { symbol: i.symbol.toUpperCase(), range: i.range ?? "1d", candles, source };
    }
    case "market.detail": {
      const i = input as { symbol: string };
      const { quotes, source } = await getQuotes([i.symbol]);
      const { candles } = await getCandles(i.symbol, "1d");
      return { quote: quotes[0] ?? null, candles, source, ts: Date.now() };
    }
    case "watchlist.list":
      return watchlistList();
    case "watchlist.add":
      return watchlistAdd(input as { symbol: string });
    case "watchlist.remove":
      return watchlistRemove(input as { symbol: string });
    default:
      throw new Error(`Unknown procedure in static mode: ${path}`);
  }
}

// ── fetch adapter for httpBatchLink ─────────────────────────────────────────

export function createStaticFetch(): typeof globalThis.fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, "https://static.local");
    const path = url.pathname.replace(/^\/api\/trpc\//, "");
    try {
      let payload: Record<string, { json?: unknown }> = {};
      if (init?.method === "POST" && typeof init.body === "string") {
        payload = JSON.parse(init.body);
      } else {
        const raw = url.searchParams.get("input");
        if (raw) payload = JSON.parse(raw);
      }
      const inputValue = payload["0"]?.json;
      const result = await dispatch(path, inputValue);
      return new Response(JSON.stringify([{ result: { data: superjson.serialize(result) } }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Static dispatch failed";
      return new Response(
        JSON.stringify([
          {
            error: {
              json: {
                message,
                code: -32603,
                data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500, path },
              },
            },
          },
        ]),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
  }) as typeof globalThis.fetch;
}
