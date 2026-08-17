/**
 * Scan universe — ~120 liquid US names across sectors.
 * basePrice / avgVolume seed the simulation engine and normalize live data.
 */

export interface UniverseEntry {
  symbol: string;
  name: string;
  sector: string;
  basePrice: number;
  avgVolume: number; // shares, ~30-day average
  /** daily volatility in % — drives the simulation random walk */
  vol: number;
}

export const UNIVERSE: UniverseEntry[] = [
  // Technology
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", basePrice: 232, avgVolume: 48000000, vol: 1.4 },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", basePrice: 428, avgVolume: 21000000, vol: 1.2 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", basePrice: 178, avgVolume: 24000000, vol: 1.5 },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Technology", basePrice: 205, avgVolume: 38000000, vol: 1.7 },
  { symbol: "META", name: "Meta Platforms", sector: "Technology", basePrice: 585, avgVolume: 12000000, vol: 1.9 },
  { symbol: "ORCL", name: "Oracle Corp.", sector: "Technology", basePrice: 172, avgVolume: 9000000, vol: 1.6 },
  { symbol: "CRM", name: "Salesforce Inc.", sector: "Technology", basePrice: 331, avgVolume: 6500000, vol: 1.7 },
  { symbol: "ADBE", name: "Adobe Inc.", sector: "Technology", basePrice: 478, avgVolume: 3200000, vol: 1.8 },
  { symbol: "NOW", name: "ServiceNow Inc.", sector: "Technology", basePrice: 985, avgVolume: 1400000, vol: 1.9 },
  { symbol: "SHOP", name: "Shopify Inc.", sector: "Technology", basePrice: 108, avgVolume: 7200000, vol: 2.6 },
  { symbol: "SNOW", name: "Snowflake Inc.", sector: "Technology", basePrice: 168, avgVolume: 5100000, vol: 2.9 },
  { symbol: "PLTR", name: "Palantir Technologies", sector: "Technology", basePrice: 68, avgVolume: 58000000, vol: 3.8 },
  { symbol: "CRWD", name: "CrowdStrike Holdings", sector: "Technology", basePrice: 352, avgVolume: 3900000, vol: 2.8 },
  { symbol: "NET", name: "Cloudflare Inc.", sector: "Technology", basePrice: 112, avgVolume: 3400000, vol: 2.9 },
  { symbol: "DDOG", name: "Datadog Inc.", sector: "Technology", basePrice: 142, avgVolume: 4100000, vol: 2.7 },
  { symbol: "UBER", name: "Uber Technologies", sector: "Technology", basePrice: 72, avgVolume: 19000000, vol: 2.2 },
  // Semiconductors
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Semiconductors", basePrice: 138, avgVolume: 240000000, vol: 3.1 },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Semiconductors", basePrice: 122, avgVolume: 42000000, vol: 2.9 },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Semiconductors", basePrice: 172, avgVolume: 22000000, vol: 2.2 },
  { symbol: "TSM", name: "Taiwan Semiconductor", sector: "Semiconductors", basePrice: 198, avgVolume: 13000000, vol: 1.9 },
  { symbol: "INTC", name: "Intel Corp.", sector: "Semiconductors", basePrice: 21, avgVolume: 62000000, vol: 2.7 },
  { symbol: "MU", name: "Micron Technology", sector: "Semiconductors", basePrice: 98, avgVolume: 21000000, vol: 2.8 },
  { symbol: "QCOM", name: "Qualcomm Inc.", sector: "Semiconductors", basePrice: 158, avgVolume: 8200000, vol: 1.9 },
  { symbol: "TXN", name: "Texas Instruments", sector: "Semiconductors", basePrice: 192, avgVolume: 5600000, vol: 1.5 },
  { symbol: "ARM", name: "ARM Holdings", sector: "Semiconductors", basePrice: 142, avgVolume: 11000000, vol: 4.1 },
  { symbol: "SMCI", name: "Super Micro Computer", sector: "Semiconductors", basePrice: 38, avgVolume: 55000000, vol: 6.2 },
  { symbol: "MRVL", name: "Marvell Technology", sector: "Semiconductors", basePrice: 112, avgVolume: 13000000, vol: 3.0 },
  // Healthcare & Biotech
  { symbol: "LLY", name: "Eli Lilly & Co.", sector: "Healthcare", basePrice: 782, avgVolume: 2900000, vol: 1.8 },
  { symbol: "UNH", name: "UnitedHealth Group", sector: "Healthcare", basePrice: 512, avgVolume: 3800000, vol: 1.5 },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", basePrice: 152, avgVolume: 7400000, vol: 0.9 },
  { symbol: "PFE", name: "Pfizer Inc.", sector: "Healthcare", basePrice: 25, avgVolume: 38000000, vol: 1.4 },
  { symbol: "ABBV", name: "AbbVie Inc.", sector: "Healthcare", basePrice: 192, avgVolume: 5900000, vol: 1.3 },
  { symbol: "MRK", name: "Merck & Co.", sector: "Healthcare", basePrice: 98, avgVolume: 11000000, vol: 1.4 },
  { symbol: "TMO", name: "Thermo Fisher Scientific", sector: "Healthcare", basePrice: 542, avgVolume: 1600000, vol: 1.5 },
  { symbol: "ISRG", name: "Intuitive Surgical", sector: "Healthcare", basePrice: 528, avgVolume: 1700000, vol: 1.8 },
  { symbol: "VRTX", name: "Vertex Pharmaceuticals", sector: "Biotech", basePrice: 462, avgVolume: 1300000, vol: 1.7 },
  { symbol: "REGN", name: "Regeneron Pharmaceuticals", sector: "Biotech", basePrice: 742, avgVolume: 800000, vol: 1.9 },
  { symbol: "MRNA", name: "Moderna Inc.", sector: "Biotech", basePrice: 38, avgVolume: 9800000, vol: 3.9 },
  { symbol: "BNTX", name: "BioNTech SE", sector: "Biotech", basePrice: 108, avgVolume: 900000, vol: 2.8 },
  // Financials
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Financials", basePrice: 248, avgVolume: 9200000, vol: 1.3 },
  { symbol: "BAC", name: "Bank of America", sector: "Financials", basePrice: 46, avgVolume: 34000000, vol: 1.5 },
  { symbol: "WFC", name: "Wells Fargo", sector: "Financials", basePrice: 76, avgVolume: 15000000, vol: 1.5 },
  { symbol: "GS", name: "Goldman Sachs", sector: "Financials", basePrice: 588, avgVolume: 2200000, vol: 1.6 },
  { symbol: "MS", name: "Morgan Stanley", sector: "Financials", basePrice: 132, avgVolume: 7800000, vol: 1.6 },
  { symbol: "V", name: "Visa Inc.", sector: "Financials", basePrice: 308, avgVolume: 6200000, vol: 1.1 },
  { symbol: "MA", name: "Mastercard Inc.", sector: "Financials", basePrice: 528, avgVolume: 2500000, vol: 1.2 },
  { symbol: "COIN", name: "Coinbase Global", sector: "Financials", basePrice: 268, avgVolume: 8900000, vol: 5.2 },
  { symbol: "HOOD", name: "Robinhood Markets", sector: "Financials", basePrice: 38, avgVolume: 28000000, vol: 4.4 },
  { symbol: "SOFI", name: "SoFi Technologies", sector: "Financials", basePrice: 15, avgVolume: 52000000, vol: 3.8 },
  { symbol: "SCHW", name: "Charles Schwab", sector: "Financials", basePrice: 82, avgVolume: 8900000, vol: 1.6 },
  // Energy
  { symbol: "XOM", name: "Exxon Mobil", sector: "Energy", basePrice: 118, avgVolume: 16000000, vol: 1.2 },
  { symbol: "CVX", name: "Chevron Corp.", sector: "Energy", basePrice: 152, avgVolume: 7800000, vol: 1.2 },
  { symbol: "OXY", name: "Occidental Petroleum", sector: "Energy", basePrice: 48, avgVolume: 11000000, vol: 1.9 },
  { symbol: "SLB", name: "Schlumberger", sector: "Energy", basePrice: 40, avgVolume: 12000000, vol: 1.8 },
  { symbol: "EOG", name: "EOG Resources", sector: "Energy", basePrice: 128, avgVolume: 3400000, vol: 1.6 },
  { symbol: "DVN", name: "Devon Energy", sector: "Energy", basePrice: 36, avgVolume: 9800000, vol: 2.2 },
  { symbol: "FANG", name: "Diamondback Energy", sector: "Energy", basePrice: 168, avgVolume: 2100000, vol: 1.9 },
  // Consumer
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer", basePrice: 348, avgVolume: 95000000, vol: 4.2 },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer", basePrice: 92, avgVolume: 15000000, vol: 0.9 },
  { symbol: "COST", name: "Costco Wholesale", sector: "Consumer", basePrice: 918, avgVolume: 1900000, vol: 1.1 },
  { symbol: "NKE", name: "Nike Inc.", sector: "Consumer", basePrice: 76, avgVolume: 11000000, vol: 1.9 },
  { symbol: "SBUX", name: "Starbucks Corp.", sector: "Consumer", basePrice: 96, avgVolume: 8900000, vol: 1.6 },
  { symbol: "MCD", name: "McDonald's Corp.", sector: "Consumer", basePrice: 292, avgVolume: 3200000, vol: 1.0 },
  { symbol: "HD", name: "Home Depot", sector: "Consumer", basePrice: 408, avgVolume: 3100000, vol: 1.3 },
  { symbol: "ABNB", name: "Airbnb Inc.", sector: "Consumer", basePrice: 132, avgVolume: 4800000, vol: 2.4 },
  { symbol: "RBLX", name: "Roblox Corp.", sector: "Consumer", basePrice: 58, avgVolume: 9200000, vol: 3.6 },
  // Industrials
  { symbol: "BA", name: "Boeing Co.", sector: "Industrials", basePrice: 178, avgVolume: 8900000, vol: 2.3 },
  { symbol: "CAT", name: "Caterpillar Inc.", sector: "Industrials", basePrice: 382, avgVolume: 2400000, vol: 1.4 },
  { symbol: "GE", name: "GE Aerospace", sector: "Industrials", basePrice: 178, avgVolume: 5600000, vol: 1.7 },
  { symbol: "RTX", name: "RTX Corp.", sector: "Industrials", basePrice: 122, avgVolume: 4800000, vol: 1.2 },
  { symbol: "LMT", name: "Lockheed Martin", sector: "Industrials", basePrice: 478, avgVolume: 1300000, vol: 1.1 },
  { symbol: "DE", name: "Deere & Co.", sector: "Industrials", basePrice: 452, avgVolume: 1400000, vol: 1.6 },
  { symbol: "UPS", name: "United Parcel Service", sector: "Industrials", basePrice: 128, avgVolume: 3600000, vol: 1.5 },
  // Communication
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Communication", basePrice: 892, avgVolume: 2900000, vol: 2.0 },
  { symbol: "DIS", name: "Walt Disney Co.", sector: "Communication", basePrice: 112, avgVolume: 9800000, vol: 1.5 },
  { symbol: "T", name: "AT&T Inc.", sector: "Communication", basePrice: 23, avgVolume: 32000000, vol: 1.0 },
  { symbol: "VZ", name: "Verizon Communications", sector: "Communication", basePrice: 42, avgVolume: 18000000, vol: 1.0 },
  { symbol: "TMUS", name: "T-Mobile US", sector: "Communication", basePrice: 232, avgVolume: 4200000, vol: 1.2 },
  { symbol: "SPOT", name: "Spotify Technology", sector: "Communication", basePrice: 478, avgVolume: 1500000, vol: 2.6 },
  { symbol: "RDDT", name: "Reddit Inc.", sector: "Communication", basePrice: 168, avgVolume: 6800000, vol: 5.4 },
  { symbol: "PINS", name: "Pinterest Inc.", sector: "Communication", basePrice: 30, avgVolume: 11000000, vol: 2.6 },
  { symbol: "SNAP", name: "Snap Inc.", sector: "Communication", basePrice: 11, avgVolume: 32000000, vol: 3.4 },
  // EV & Clean Energy
  { symbol: "RIVN", name: "Rivian Automotive", sector: "EV & Clean Energy", basePrice: 13, avgVolume: 38000000, vol: 4.6 },
  { symbol: "LCID", name: "Lucid Group", sector: "EV & Clean Energy", basePrice: 3.2, avgVolume: 42000000, vol: 5.1 },
  { symbol: "NIO", name: "NIO Inc.", sector: "EV & Clean Energy", basePrice: 4.8, avgVolume: 56000000, vol: 4.2 },
  { symbol: "F", name: "Ford Motor Co.", sector: "EV & Clean Energy", basePrice: 11, avgVolume: 52000000, vol: 1.8 },
  { symbol: "GM", name: "General Motors", sector: "EV & Clean Energy", basePrice: 54, avgVolume: 14000000, vol: 1.7 },
  { symbol: "ENPH", name: "Enphase Energy", sector: "EV & Clean Energy", basePrice: 68, avgVolume: 4300000, vol: 3.8 },
  { symbol: "FSLR", name: "First Solar", sector: "EV & Clean Energy", basePrice: 192, avgVolume: 2800000, vol: 3.2 },
  { symbol: "PLUG", name: "Plug Power", sector: "EV & Clean Energy", basePrice: 2.4, avgVolume: 48000000, vol: 6.4 },
  { symbol: "CHPT", name: "ChargePoint Holdings", sector: "EV & Clean Energy", basePrice: 1.4, avgVolume: 18000000, vol: 6.8 },
];

export const UNIVERSE_MAP = new Map(UNIVERSE.map((u) => [u.symbol, u]));
