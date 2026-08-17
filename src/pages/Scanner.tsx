import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, SlidersHorizontal, Table2 } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_FILTERS,
  SCAN_PRESETS,
  type Quote,
  type ScanFilters,
  type ScanSortKey,
} from "@contracts/market";
import { trpc } from "@/providers/trpc";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import TopBar, { type SessionTab } from "@/components/scanner/TopBar";
import FilterRail, { type SavedScan } from "@/components/scanner/FilterRail";
import ResultsTable, { type TableSortKey } from "@/components/scanner/ResultsTable";
import Heatmap from "@/components/scanner/Heatmap";
import AlertsRail, { type AlertConfig } from "@/components/scanner/AlertsRail";
import DetailDrawer from "@/components/scanner/DetailDrawer";
import {
  applyClientFilters,
  enrich,
  signalFor,
  tickSound,
  SORT_LABEL,
  DEFAULT_CLIENT_FILTERS,
  type ClientFilters,
  type FlashMap,
  type RowExt,
  type ScanAlert,
} from "@/components/scanner/derive";

const SERVER_SORT: Record<TableSortKey, ScanSortKey> = {
  symbol: "score",
  price: "dollarVolume",
  changePct: "changePct",
  rvol: "rvol",
  rsi: "score",
  float: "dollarVolume",
  signal: "score",
  score: "score",
};

function useMedia(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setMatches(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [query]);
  return matches;
}

export default function Scanner() {
  const [searchParams] = useSearchParams();

  /* ---------- core state ---------- */
  const [filters, setFilters] = useState<ScanFilters>({ ...DEFAULT_FILTERS });
  const [clientFilters, setClientFilters] = useState<ClientFilters>({
    ...DEFAULT_CLIENT_FILTERS,
  });
  const [session, setSession] = useState<SessionTab>("regular");
  const [sortKey, setSortKey] = useState<TableSortKey>("score");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [view, setView] = useState<"table" | "heatmap">("table");
  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alerts, setAlerts] = useState<ScanAlert[]>([]);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ notify: false, minScore: 0 });
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);
  const [highlight, setHighlight] = useState<{ symbol: string; key: number } | null>(null);
  const [mobileTab, setMobileTab] = useState<"results" | "alerts">("results");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const isDesktop = useMedia("(min-width: 1280px)");
  const hasRail = useMedia("(min-width: 1024px)");

  /* ---------- queries ---------- */
  const statusQ = trpc.market.status.useQuery(undefined, { refetchInterval: 30_000 });
  const presetsQ = trpc.market.presets.useQuery(undefined, { staleTime: Infinity });
  const scanQ = trpc.market.scan.useQuery(
    { filters, sort: SERVER_SORT[sortKey], limit: 120 },
    { refetchInterval: paused ? false : 4000, refetchOnWindowFocus: false },
  );
  const presets = presetsQ.data ?? SCAN_PRESETS;

  /* ---------- watchlist (server-persisted w/ local fallback) ---------- */
  const utils = trpc.useUtils();
  const wlQ = trpc.watchlist.list.useQuery(undefined, { retry: false });
  const [localWL, setLocalWL] = useState<string[]>([]);
  const persisted = wlQ.data?.persisted ?? false;
  const watchlist = useMemo(() => {
    const server = wlQ.data?.items.map((i) => i.symbol) ?? [];
    return persisted ? server : Array.from(new Set([...localWL, ...server]));
  }, [wlQ.data, persisted, localWL]);

  const addM = trpc.watchlist.add.useMutation({
    onSuccess: (res) => {
      if (res.persisted) void utils.watchlist.list.invalidate();
    },
  });
  const removeM = trpc.watchlist.remove.useMutation({
    onSuccess: (res) => {
      if (res.persisted) void utils.watchlist.list.invalidate();
    },
  });

  const toggleWatch = (symbol: string) => {
    if (watchlist.includes(symbol)) {
      removeM.mutate(
        { symbol },
        { onError: () => setLocalWL((l) => l.filter((s) => s !== symbol)) },
      );
      if (!persisted) setLocalWL((l) => l.filter((s) => s !== symbol));
      toast(`${symbol} removed from watchlist`);
    } else {
      addM.mutate(
        { symbol },
        { onError: () => setLocalWL((l) => (l.includes(symbol) ? l : [...l, symbol])) },
      );
      if (!persisted) setLocalWL((l) => (l.includes(symbol) ? l : [...l, symbol]));
      toast.success(`${symbol} added to watchlist`);
    }
  };

  /* ---------- live diff: flashes + alerts + spark histories ---------- */
  const prevRowsRef = useRef<Map<string, Quote> | null>(null);
  const historiesRef = useRef(new Map<string, number[]>());
  const flashKeyRef = useRef(0);
  const alertIdRef = useRef(0);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flashes, setFlashes] = useState<FlashMap>({});
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;
  const alertCfgRef = useRef(alertConfig);
  alertCfgRef.current = alertConfig;

  useEffect(() => {
    const data = scanQ.data;
    if (!data) return;
    const prev = prevRowsRef.current;
    const next = new Map(data.rows.map((r) => [r.symbol, r]));

    for (const r of data.rows) {
      const h = historiesRef.current.get(r.symbol) ?? [];
      if (h[h.length - 1] !== r.price) {
        h.push(r.price);
        if (h.length > 30) h.shift();
        historiesRef.current.set(r.symbol, h);
      }
    }

    if (prev && prev.size > 0) {
      const fl: FlashMap = {};
      const newAlerts: ScanAlert[] = [];
      const minScore = alertCfgRef.current.minScore;
      const pushAlert = (
        q: Quote,
        kind: ScanAlert["kind"],
        text: string,
        severity: ScanAlert["severity"],
      ) => {
        newAlerts.push({
          id: ++alertIdRef.current,
          symbol: q.symbol,
          kind,
          severity,
          text,
          score: q.score,
          scoreParts: q.scoreParts,
          signal: signalFor(q),
          ts: Date.now(),
        });
      };

      for (const [sym, q] of next) {
        const p = prev.get(sym);
        if (!p) {
          if (q.score >= Math.max(minScore, 50))
            pushAlert(q, "enter", `${q.symbol} entered scan results at $${q.price.toFixed(2)}`, q.changePct >= 0 ? "opportunity" : "risk");
          continue;
        }
        if (q.price !== p.price) {
          fl[sym] = { ...fl[sym], price: { dir: q.price > p.price ? "up" : "down", key: ++flashKeyRef.current } };
        }
        if (Math.round(q.score) !== Math.round(p.score)) {
          fl[sym] = { ...fl[sym], score: { dir: q.score > p.score ? "up" : "down", key: ++flashKeyRef.current } };
          if (q.score - p.score > 10 && q.score >= minScore)
            pushAlert(q, "score", `${q.symbol} quant score jumped +${Math.round(q.score - p.score)} to ${Math.round(q.score)}`, "opportunity");
        }
        if (p.rvol < 3 && q.rvol >= 3 && q.score >= minScore)
          pushAlert(q, "rvol", `${q.symbol} RVOL spike — ${q.rvol.toFixed(1)}× relative volume`, "watch");
        if (q.dayHigh > p.dayHigh + 1e-9 && q.price >= q.dayHigh * 0.998 && q.changePct > 0)
          pushAlert(q, "high", `${q.symbol} broke to a new day high $${q.dayHigh.toFixed(2)}`, "opportunity");
      }

      if (Object.keys(fl).length > 0) {
        setFlashes(fl);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setFlashes({}), 320);
      }
      if (newAlerts.length > 0) {
        setAlerts((a) => [...newAlerts.slice(0, 4), ...a].slice(0, 30));
        tickSound(soundRef.current);
        if (
          alertCfgRef.current.notify &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          const a0 = newAlerts[0]!;
          new Notification(`EDGEHAWK — ${a0.symbol}`, { body: a0.text });
        }
      }
    }
    prevRowsRef.current = next;
  }, [scanQ.data]);

  /* ---------- derived rows ---------- */
  const extRows = useMemo(() => (scanQ.data?.rows ?? []).map(enrich), [scanQ.data]);
  const filteredRows = useMemo(
    () => applyClientFilters(extRows, clientFilters),
    [extRows, clientFilters],
  );
  const sortedRows = useMemo(() => {
    const val = (r: RowExt): number | string => {
      switch (sortKey) {
        case "symbol": return r.symbol;
        case "price": return r.price;
        case "changePct": return r.changePct;
        case "rvol": return r.rvol;
        case "float": return r.floatM;
        case "signal": return r.signal;
        default: return r.score;
      }
    };
    return [...filteredRows].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      const c = av < bv ? -1 : av > bv ? 1 : 0;
      return c * sortDir;
    });
  }, [filteredRows, sortKey, sortDir]);

  const alertedSymbols = useMemo(() => new Set(alerts.slice(0, 12).map((a) => a.symbol)), [alerts]);

  /* ---------- interactions ---------- */
  const onSort = (k: TableSortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(k);
      setSortDir(k === "symbol" ? 1 : -1);
    }
  };

  const openSymbol = (symbol: string) => {
    setSelected(symbol);
    setDrawerOpen(true);
  };

  const onAlertClick = (symbol: string) => {
    setHighlight({ symbol, key: Date.now() });
    setMobileTab("results");
    openSymbol(symbol);
    setTimeout(() => setHighlight((h) => (h?.symbol === symbol ? null : h)), 2600);
  };

  const onSession = (s: SessionTab) => {
    setSession(s);
    if (s === "regular") {
      setSortKey("score");
      setSortDir(-1);
    } else {
      setSortKey("changePct");
      setSortDir(-1);
    }
    prevRowsRef.current = null; // re-seed diff baseline so rows cascade fresh
  };

  const saveScan = (name: string) => {
    setSavedScans((l) => [...l, { name, filters, clientFilters }]);
    toast.success("Scan saved");
  };

  // deep link ?symbol=
  useEffect(() => {
    const sym = searchParams.get("symbol");
    if (sym) openSymbol(sym.toUpperCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeFilterCount =
    (filters.minPrice > DEFAULT_FILTERS.minPrice ? 1 : 0) +
    (filters.maxPrice < DEFAULT_FILTERS.maxPrice ? 1 : 0) +
    (filters.minChangePct > 0 ? 1 : 0) +
    (filters.minRvol > 0 ? 1 : 0) +
    (filters.minScore > 0 ? 1 : 0) +
    (filters.patterns.length > 0 ? 1 : 0) +
    (filters.minOptionsRatio > 0 ? 1 : 0) +
    (filters.earningsWithinDays > 0 ? 1 : 0) +
    (filters.sectors.length > 0 ? 1 : 0) +
    (clientFilters.floatBucket !== 3 ? 1 : 0) +
    (clientFilters.signals.length < 4 ? 1 : 0) +
    (clientFilters.needNews || clientFilters.needEarnings || clientFilters.needHighShort ? 1 : 0);

  const sessionLabel =
    session === "regular" ? "RTH" : session === "pre" ? "PRE-MARKET" : "AFTER-HOURS";

  const filterRail = (
    <FilterRail
      filters={filters}
      onFilters={setFilters}
      clientFilters={clientFilters}
      onClientFilters={setClientFilters}
      presets={presets}
      matched={filteredRows.length}
      savedScans={savedScans}
      onSaveScan={saveScan}
      onApplyScan={(s) => {
        setFilters(s.filters);
        setClientFilters(s.clientFilters);
        toast(`Loaded scan "${s.name}"`);
      }}
      watchlist={watchlist}
      onRemoveWatch={toggleWatch}
      onSelect={openSymbol}
    />
  );

  const alertsRail = (
    <AlertsRail
      alerts={alerts}
      onSelect={onAlertClick}
      config={alertConfig}
      onConfig={setAlertConfig}
      soundOn={soundOn}
      onToggleSound={() => setSoundOn((v) => !v)}
    />
  );

  return (
    <div
      data-workspace
      className="flex h-[calc(100dvh-64px)] flex-col overflow-hidden bg-abyss"
    >
      <TopBar
        session={session}
        onSession={onSession}
        status={statusQ.data}
        total={scanQ.data?.total ?? 0}
        source={scanQ.data?.source ?? statusQ.data?.source}
        paused={paused}
        onTogglePause={() => setPaused((v) => !v)}
        soundOn={soundOn}
        onToggleSound={() => setSoundOn((v) => !v)}
      />

      <div className="flex min-h-0 flex-1">
        {/* Left rail — filters */}
        {hasRail && (
          <motion.aside
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[280px] shrink-0 overflow-hidden border-r border-grid bg-carbon"
          >
            <div className="scanline-sweep" />
            {filterRail}
          </motion.aside>
        )}

        {/* Center — results */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="relative flex min-w-0 flex-1 flex-col overflow-hidden"
        >
          <div className="scanline-sweep" />

          {/* Panel chrome */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-grid bg-carbon px-3 lg:px-4">
            <span className="truncate font-mono text-[11px] tracking-wider text-ink-secondary">
              RESULTS — {sessionLabel} · sorted by{" "}
              <span className="text-ink-primary">{SORT_LABEL[sortKey]}</span>
              <span className="ml-2 text-ink-muted">
                {filteredRows.length}/{scanQ.data?.matched ?? 0}
              </span>
            </span>
            <div className="flex items-center gap-1">
              {/* mobile results/alerts switch */}
              {!isDesktop && (
                <div className="mr-2 flex rounded-lg border border-grid bg-steel p-0.5">
                  {(["results", "alerts"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setMobileTab(t)}
                      className={cn(
                        "rounded-md px-2.5 py-1 font-mono text-[10px] uppercase transition-colors",
                        mobileTab === t ? "bg-pulse/10 text-pulse" : "text-ink-muted",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setView("table")}
                aria-label="Table view"
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
                  view === "table"
                    ? "border-pulse/50 bg-pulse/10 text-pulse"
                    : "border-grid text-ink-muted hover:text-ink-primary",
                )}
              >
                <Table2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setView("heatmap")}
                aria-label="Heatmap view"
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
                  view === "heatmap"
                    ? "border-pulse/50 bg-pulse/10 text-pulse"
                    : "border-grid text-ink-muted hover:text-ink-primary",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          {mobileTab === "alerts" && !isDesktop ? (
            <div className="min-h-0 flex-1 bg-carbon">{alertsRail}</div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex min-h-0 flex-1 flex-col"
              >
                {view === "table" ? (
                  <div data-lenis-prevent className="flex min-h-0 flex-1 flex-col">
                    <ResultsTable
                      rows={sortedRows}
                      flashes={flashes}
                      histories={historiesRef.current}
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={onSort}
                      onSelect={openSymbol}
                      highlight={highlight}
                      alerted={alertedSymbols}
                      paused={paused}
                      loading={scanQ.isPending}
                    />
                  </div>
                ) : (
                  <div data-lenis-prevent className="flex min-h-0 flex-1 flex-col">
                    <Heatmap
                      rows={sortedRows}
                      histories={historiesRef.current}
                      onSelect={openSymbol}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </motion.section>

        {/* Right rail — alerts */}
        {isDesktop && (
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[300px] shrink-0 overflow-hidden border-l border-grid bg-carbon"
          >
            <div className="scanline-sweep" />
            {alertsRail}
          </motion.aside>
        )}
      </div>

      {/* Mobile floating filters pill */}
      {!hasRail && (
        <button
          onClick={() => setFiltersOpen(true)}
          className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-pulse/40 bg-carbon px-4 py-2.5 font-mono text-xs text-pulse shadow-glow"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
        </button>
      )}
      {!hasRail && (
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetContent side="left" className="w-[300px] border-r border-grid bg-carbon p-0">
            <SheetTitle className="sr-only">Filters</SheetTitle>
            <div data-lenis-prevent className="h-full overflow-hidden">
              {filterRail}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Symbol detail drawer */}
      <DetailDrawer
        symbol={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        watched={selected ? watchlist.includes(selected) : false}
        onToggleWatch={toggleWatch}
      />

      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
