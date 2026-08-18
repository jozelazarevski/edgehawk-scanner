#!/usr/bin/env python3
"""
Fetch real market data via yfinance and write data/quotes.json.

Outputs:
  quotes:  { SYM: {price, open, prevClose, dayHigh, dayLow, volume} }
  history: { SYM: {closes[], highs[], lows[]} }  (60 daily bars ending yesterday)

Intraday stats come from 15m bars when available (market days); on
weekends/holidays the last daily bar is used instead.
"""
import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import yfinance as yf

UNIVERSE_TS = Path("api/market/universe.ts").read_text()
SYMBOLS = re.findall(r'symbol:\s*"([A-Z.]+)"', UNIVERSE_TS)
if len(SYMBOLS) < 50:
    sys.exit(f"symbol parse failed, got {len(SYMBOLS)}")

TODAY_ET = datetime.now(ZoneInfo("America/New_York")).date().isoformat()


def safe_download(**kw):
    for attempt in range(3):
        try:
            df = yf.download(**kw)
            if df is not None and len(df) > 0:
                return df
        except Exception as e:
            print(f"download attempt {attempt + 1} failed: {e}", file=sys.stderr)
        time.sleep(5 * (attempt + 1))
    return None


print(f"fetching daily history for {len(SYMBOLS)} symbols...")
daily = safe_download(
    tickers=" ".join(SYMBOLS), period="3mo", interval="1d",
    group_by="ticker", threads=True, progress=False, auto_adjust=False,
)
if daily is None:
    sys.exit("daily download failed")

print("fetching intraday 15m bars...")
intra = safe_download(
    tickers=" ".join(SYMBOLS), period="1d", interval="15m",
    group_by="ticker", threads=True, progress=False, auto_adjust=False,
)

quotes = {}
history = {}
ok = 0
for sym in SYMBOLS:
    try:
        d = daily[sym].dropna(how="all")
    except Exception:
        continue
    if d is None or len(d) < 31:
        continue

    dates = [idx.date().isoformat() for idx in d.index]
    closes_all = [float(x) for x in d["Close"]]
    highs_all = [float(x) for x in d["High"]]
    lows_all = [float(x) for x in d["Low"]]
    vols_all = [float(x) if x == x else 0.0 for x in d["Volume"]]

    # Split off today's partial bar (if present) so history ends yesterday
    if dates[-1] == TODAY_ET:
        hist_slice = slice(0, -1)
        today_daily = {
            "open": float(d["Open"].iloc[-1]),
            "high": highs_all[-1],
            "low": lows_all[-1],
            "volume": vols_all[-1],
        }
    else:
        hist_slice = slice(0, len(closes_all))
        today_daily = None

    closes = closes_all[hist_slice][-60:]
    highs = highs_all[hist_slice][-60:]
    lows = lows_all[hist_slice][-60:]
    if len(closes) < 30:
        continue
    prev_close = closes[-1]

    # Intraday stats
    price = None
    if intra is not None:
        try:
            i = intra[sym].dropna(how="all")
            if i is not None and len(i) > 0:
                price = float(i["Close"].iloc[-1])
                day_open = float(i["Open"].iloc[0])
                day_high = float(i["High"].max())
                day_low = float(i["Low"].min())
                day_vol = float(i["Volume"].sum())
        except Exception:
            price = None
    if price is None:
        if today_daily:
            price = closes_all[-1]
            day_open = today_daily["open"]
            day_high = today_daily["high"]
            day_low = today_daily["low"]
            day_vol = today_daily["volume"]
        else:
            price = prev_close
            day_open = float(d["Open"].iloc[-1])
            day_high = highs_all[-1]
            day_low = lows_all[-1]
            day_vol = vols_all[-1]

    quotes[sym] = {
        "price": round(price, 2),
        "open": round(day_open, 2),
        "prevClose": round(prev_close, 2),
        "dayHigh": round(max(day_high, price), 2),
        "dayLow": round(min(day_low, price), 2),
        "volume": int(day_vol),
    }
    history[sym] = {
        "closes": [round(c, 2) for c in closes],
        "highs": [round(h, 2) for h in highs],
        "lows": [round(l, 2) for l in lows],
    }
    ok += 1

if ok < 50:
    sys.exit(f"only {ok} symbols parsed — refusing to write snapshot")

Path("data").mkdir(exist_ok=True)
out = {"ts": int(time.time()), "quotes": quotes, "history": history}
Path("data/quotes.json").write_text(json.dumps(out))
print(f"snapshot written: {ok} symbols, {Path('data/quotes.json').stat().st_size // 1024}KB")
