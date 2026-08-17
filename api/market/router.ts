import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getCandles, getMarketStatus, getQuotes, scan } from "./engine";
import { SCAN_PRESETS } from "../../contracts/market";

const filtersSchema = z.object({
  presetId: z.string().optional(),
  direction: z.enum(["up", "down", "both"]),
  minPrice: z.number().min(0),
  maxPrice: z.number().min(0),
  minChangePct: z.number().min(0),
  minGapPct: z.number().min(0),
  minRvol: z.number().min(0),
  minVolume: z.number().min(0),
  minScore: z.number().min(0).max(100),
  sectors: z.array(z.string()),
  search: z.string(),
  patterns: z.array(z.string()).default([]),
  minOptionsRatio: z.number().min(0).default(0),
  earningsWithinDays: z.number().min(0).max(60).default(0),
});

const sortSchema = z.enum(["score", "changePct", "gapPct", "rvol", "volume", "dollarVolume"]);

export const marketRouter = createRouter({
  status: publicQuery.query(async () => {
    const { source } = await getQuotes(["AAPL"]);
    return getMarketStatus(source);
  }),

  quotes: publicQuery
    .input(z.object({ symbols: z.array(z.string()).max(150).optional() }).optional())
    .query(async ({ input }) => {
      const { quotes, source } = await getQuotes(input?.symbols);
      return { quotes, source, ts: Date.now() };
    }),

  scan: publicQuery
    .input(
      z.object({
        filters: filtersSchema,
        sort: sortSchema.default("score"),
        limit: z.number().min(1).max(200).default(50),
      }),
    )
    .query(async ({ input }) => {
      const result = await scan(input.filters, input.sort, input.limit);
      return { ...result, ts: Date.now() };
    }),

  presets: publicQuery.query(() => SCAN_PRESETS),

  candles: publicQuery
    .input(z.object({ symbol: z.string().min(1).max(12), range: z.string().default("1d") }))
    .query(async ({ input }) => {
      const { candles, source } = await getCandles(input.symbol, input.range);
      return { symbol: input.symbol.toUpperCase(), range: input.range, candles, source };
    }),

  detail: publicQuery
    .input(z.object({ symbol: z.string().min(1).max(12) }))
    .query(async ({ input }) => {
      const { quotes, source } = await getQuotes([input.symbol]);
      const quote = quotes[0] ?? null;
      const { candles } = await getCandles(input.symbol, "1d");
      return { quote, candles, source, ts: Date.now() };
    }),
});
