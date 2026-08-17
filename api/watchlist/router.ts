import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { addWatchlistSymbol, listWatchlist, removeWatchlistSymbol } from "../queries/watchlist";

export const watchlistRouter = createRouter({
  list: publicQuery.query(() => listWatchlist()),
  add: publicQuery.input(z.object({ symbol: z.string().min(1).max(16) })).mutation(({ input }) =>
    addWatchlistSymbol(input.symbol),
  ),
  remove: publicQuery.input(z.object({ symbol: z.string().min(1).max(16) })).mutation(({ input }) =>
    removeWatchlistSymbol(input.symbol),
  ),
});
