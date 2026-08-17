import { mysqlTable, serial, varchar, timestamp, uniqueIndex } from "drizzle-orm/mysql-core";

export const watchlistItems = mysqlTable(
  "watchlist_items",
  {
    id: serial("id").primaryKey(),
    symbol: varchar("symbol", { length: 16 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("watchlist_symbol_unique").on(t.symbol)],
);
