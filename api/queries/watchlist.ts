import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "./connection";
import { watchlistItems } from "@db/schema";

/**
 * Resilient watchlist access.
 *
 * The platform MySQL is reachable from the deployed runtime but not from
 * every build/dev sandbox. On first use we lazily guarantee the table
 * (CREATE TABLE IF NOT EXISTS); if the DB is entirely unreachable we degrade
 * to `persisted: false` and the UI keeps the watchlist in-session.
 */

let ensured = false;

async function ensureTable(): Promise<void> {
  if (ensured) return;
  await getDb().execute(sql`
    CREATE TABLE IF NOT EXISTS watchlist_items (
      id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
      symbol varchar(16) NOT NULL,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY watchlist_symbol_unique (symbol)
    )
  `);
  ensured = true;
}

export interface WatchlistResult {
  items: Array<{ id: number; symbol: string; createdAt: Date }>;
  persisted: boolean;
}

export async function listWatchlist(): Promise<WatchlistResult> {
  try {
    await ensureTable();
    const items = await getDb().select().from(watchlistItems).orderBy(desc(watchlistItems.createdAt));
    return { items, persisted: true };
  } catch {
    return { items: [], persisted: false };
  }
}

export async function addWatchlistSymbol(symbol: string): Promise<WatchlistResult> {
  const sym = symbol.toUpperCase().trim();
  try {
    await ensureTable();
    await getDb()
      .insert(watchlistItems)
      .values({ symbol: sym })
      .onDuplicateKeyUpdate({ set: { symbol: sym } });
    return listWatchlist();
  } catch {
    return { items: [{ id: Date.now(), symbol: sym, createdAt: new Date() }], persisted: false };
  }
}

export async function removeWatchlistSymbol(symbol: string): Promise<WatchlistResult> {
  const sym = symbol.toUpperCase().trim();
  try {
    await ensureTable();
    await getDb().delete(watchlistItems).where(eq(watchlistItems.symbol, sym));
    return listWatchlist();
  } catch {
    return { items: [], persisted: false };
  }
}
