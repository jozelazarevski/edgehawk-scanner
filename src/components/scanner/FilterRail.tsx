import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Save, Star, X } from "lucide-react";
import {
  DEFAULT_FILTERS,
  PATTERN_SIGNALS,
  type ScanFilters,
  type ScanPreset,
} from "@contracts/market";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  FLOAT_BUCKETS,
  PATTERN_CHIP,
  SIGNALS,
  SIGNAL_COLOR,
  type ClientFilters,
  DEFAULT_CLIENT_FILTERS,
} from "./derive";

export interface SavedScan {
  name: string;
  filters: ScanFilters;
  clientFilters: ClientFilters;
}

interface Props {
  filters: ScanFilters;
  onFilters: (f: ScanFilters) => void;
  clientFilters: ClientFilters;
  onClientFilters: (cf: ClientFilters) => void;
  presets: ScanPreset[];
  matched: number;
  savedScans: SavedScan[];
  onSaveScan: (name: string) => void;
  onApplyScan: (s: SavedScan) => void;
  watchlist: string[];
  onRemoveWatch: (symbol: string) => void;
  onSelect: (symbol: string) => void;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <span className="label-eyebrow text-ink-secondary">{children}</span>;
}

export default function FilterRail({
  filters,
  onFilters,
  clientFilters,
  onClientFilters,
  presets,
  matched,
  savedScans,
  onSaveScan,
  onApplyScan,
  watchlist,
  onRemoveWatch,
  onSelect,
}: Props) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [scanName, setScanName] = useState("");

  const set = (patch: Partial<ScanFilters>) =>
    onFilters({ ...filters, presetId: undefined, ...patch });

  // Derived slider positions (presets animate the thumbs via CSS transition)
  const priceVal: [number, number] = [
    Math.max(1, Math.min(filters.minPrice, 500)),
    Math.max(1, Math.min(filters.maxPrice, 500)),
  ];
  const chgVal =
    filters.direction === "down"
      ? -filters.minChangePct
      : filters.direction === "up"
        ? filters.minChangePct
        : 0;
  const rvolVal = Math.max(filters.minRvol, 1);
  const optsVal = Math.max(filters.minOptionsRatio, 1);

  const togglePattern = (id: string) => {
    const next = filters.patterns.includes(id)
      ? filters.patterns.filter((p) => p !== id)
      : [...filters.patterns, id];
    set({ patterns: next });
  };

  const thumbTween =
    "[&_[data-slot=slider-thumb]]:transition-[left] [&_[data-slot=slider-thumb]]:duration-500 [&_[data-slot=slider-thumb]]:ease-out";

  const toggleSignal = (sig: (typeof SIGNALS)[number], on: boolean) => {
    const next = on
      ? [...clientFilters.signals, sig]
      : clientFilters.signals.filter((s) => s !== sig);
    if (next.length > 0) onClientFilters({ ...clientFilters, signals: next });
  };

  const submitSave = () => {
    const name = scanName.trim();
    if (!name) return;
    onSaveScan(name);
    setScanName("");
    setSaveOpen(false);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-grid px-4 py-3">
        <span className="label-eyebrow text-ink-primary">FILTERS</span>
        <button
          onClick={() => {
            onFilters({ ...DEFAULT_FILTERS });
            onClientFilters({ ...DEFAULT_CLIENT_FILTERS });
          }}
          className="flex items-center gap-1 font-mono text-[11px] text-ink-muted transition-colors hover:text-pulse"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <Accordion
          type="multiple"
          defaultValue={["presets", "price", "change", "rvol", "float", "patterns", "signal", "quant"]}
          className="w-full"
        >
          {/* Presets */}
          <AccordionItem value="presets" className="border-grid">
            <AccordionTrigger className="py-3 hover:no-underline">
              <GroupLabel>Preset Playbooks</GroupLabel>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-1.5 pb-2">
                {presets.map((p) => {
                  const active = filters.presetId === p.id;
                  return (
                    <button
                      key={p.id}
                      title={p.tagline}
                      onClick={() => onFilters({ ...p.filters, presetId: p.id })}
                      className={cn(
                        "rounded-md border px-2 py-1 font-mono text-[10px] transition-all duration-200",
                        active
                          ? "border-pulse bg-pulse/[0.08] text-pulse"
                          : "border-grid bg-steel text-ink-secondary hover:border-pulse/40 hover:text-ink-primary",
                      )}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Price */}
          <AccordionItem value="price" className="border-grid">
            <AccordionTrigger className="py-3 hover:no-underline">
              <GroupLabel>Price</GroupLabel>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pb-2">
                <Slider
                  min={1}
                  max={500}
                  step={1}
                  value={priceVal}
                  onValueChange={([lo, hi]) =>
                    set({ minPrice: lo ?? 1, maxPrice: (hi ?? 500) >= 500 ? 1000 : (hi ?? 500) })
                  }
                  className={thumbTween}
                />
                <div className="flex items-center gap-2">
                  {[0, 1].map((i) => (
                    <input
                      key={i}
                      type="number"
                      min={1}
                      max={500}
                      value={Math.round(priceVal[i] ?? 1)}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 1;
                        const next: [number, number] = [...priceVal] as [number, number];
                        next[i] = v;
                        set({
                          minPrice: Math.min(next[0], next[1]),
                          maxPrice: Math.max(next[0], next[1]) >= 500 ? 1000 : Math.max(next[0], next[1]),
                        });
                      }}
                      className="h-7 w-full rounded-md border border-grid bg-abyss px-2 font-mono text-xs text-ink-primary tabular-nums focus:border-pulse/50 focus:outline-none"
                    />
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* % Change */}
          <AccordionItem value="change" className="border-grid">
            <AccordionTrigger className="py-3 hover:no-underline">
              <GroupLabel>% Change</GroupLabel>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pb-2">
                <Slider
                  min={-20}
                  max={40}
                  step={0.5}
                  value={[chgVal]}
                  onValueChange={([v]) => {
                    const val = v ?? 0;
                    if (val < 0) set({ direction: "down", minChangePct: Math.abs(val) });
                    else if (val > 0) set({ direction: "up", minChangePct: val });
                    else set({ direction: "both", minChangePct: 0 });
                  }}
                  className={thumbTween}
                />
                <div className="flex justify-between font-mono text-[10px] text-ink-muted tabular-nums">
                  <span>-20%</span>
                  <span className={cn(chgVal >= 0 ? "text-pulse" : "text-signal")}>
                    {chgVal >= 0 ? "+" : ""}
                    {chgVal.toFixed(1)}%
                  </span>
                  <span>+40%</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* RelVol */}
          <AccordionItem value="rvol" className="border-grid">
            <AccordionTrigger className="py-3 hover:no-underline">
              <GroupLabel>Relative Volume</GroupLabel>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pb-2">
                <Slider
                  min={1}
                  max={50}
                  step={0.5}
                  value={[rvolVal]}
                  onValueChange={([v]) => set({ minRvol: (v ?? 1) <= 1 ? 0 : (v ?? 1) })}
                  className={cn(
                    thumbTween,
                    "[&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-pulse/40 [&_[data-slot=slider-range]]:to-pulse",
                  )}
                />
                <div className="flex justify-between font-mono text-[10px] text-ink-muted tabular-nums">
                  <span>1×</span>
                  <span className="text-pulse">{filters.minRvol <= 0 ? "ANY" : `${filters.minRvol.toFixed(1)}×`}</span>
                  <span>50×</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Float */}
          <AccordionItem value="float" className="border-grid">
            <AccordionTrigger className="py-3 hover:no-underline">
              <GroupLabel>Float</GroupLabel>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-4 gap-1 pb-2">
                {FLOAT_BUCKETS.map((b, i) => (
                  <button
                    key={b}
                    onClick={() => onClientFilters({ ...clientFilters, floatBucket: i })}
                    className={cn(
                      "rounded-md border px-1 py-1.5 font-mono text-[10px] transition-colors",
                      clientFilters.floatBucket === i
                        ? "border-pulse bg-pulse/[0.08] text-pulse"
                        : "border-grid bg-steel text-ink-secondary hover:text-ink-primary",
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Patterns & Events */}
          <AccordionItem value="patterns" className="border-grid">
            <AccordionTrigger className="py-3 hover:no-underline">
              <GroupLabel>Patterns &amp; Events</GroupLabel>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pb-2">
                {/* pattern chips (ANY match) */}
                <div className="flex flex-wrap gap-1.5">
                  {PATTERN_SIGNALS.map((p) => {
                    const chip = PATTERN_CHIP[p.id];
                    const active = filters.patterns.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        title={p.hint}
                        onClick={() => togglePattern(p.id)}
                        className={cn(
                          "rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wide transition-all duration-200",
                          !active &&
                            "border-grid bg-steel text-ink-secondary hover:border-ink-muted hover:text-ink-primary",
                        )}
                        style={
                          active && chip
                            ? {
                                color: chip.color,
                                borderColor: chip.color,
                                backgroundColor: `${chip.color}14`,
                              }
                            : undefined
                        }
                      >
                        {chip?.abbr ?? p.label}
                      </button>
                    );
                  })}
                </div>

                {/* options activity */}
                <div className="space-y-2">
                  <Slider
                    min={1}
                    max={5}
                    step={0.5}
                    value={[optsVal]}
                    onValueChange={([v]) =>
                      set({ minOptionsRatio: (v ?? 1) <= 1 ? 0 : (v ?? 1) })
                    }
                    className={cn(
                      thumbTween,
                      "[&_[data-slot=slider-range]]:bg-amber-watch [&_[data-slot=slider-thumb]]:border-amber-watch",
                    )}
                  />
                  <div className="flex justify-between font-mono text-[10px] text-ink-muted tabular-nums">
                    <span>1x</span>
                    <span className="text-amber-watch">
                      {filters.minOptionsRatio <= 0
                        ? "OPTIONS ANY"
                        : `OPTIONS ≥ ${filters.minOptionsRatio.toFixed(1)}x AVG`}
                    </span>
                    <span>5x</span>
                  </div>
                </div>

                {/* earnings proximity */}
                <div>
                  <div className="label-eyebrow mb-1.5 text-[9px] text-ink-muted">
                    Earnings within
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {(
                      [
                        ["OFF", 0],
                        ["5D", 5],
                        ["10D", 10],
                        ["30D", 30],
                      ] as const
                    ).map(([label, days]) => (
                      <button
                        key={label}
                        onClick={() => set({ earningsWithinDays: days })}
                        className={cn(
                          "rounded-md border px-1 py-1.5 font-mono text-[10px] transition-colors",
                          filters.earningsWithinDays === days
                            ? "border-pulse bg-pulse/[0.08] text-pulse"
                            : "border-grid bg-steel text-ink-secondary hover:text-ink-primary",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Signal Type */}
          <AccordionItem value="signal" className="border-grid">
            <AccordionTrigger className="py-3 hover:no-underline">
              <GroupLabel>Signal Type</GroupLabel>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pb-2">
                {SIGNALS.map((sig) => (
                  <label
                    key={sig}
                    className="flex cursor-pointer items-center gap-2.5 font-mono text-xs text-ink-secondary hover:text-ink-primary"
                  >
                    <Checkbox
                      checked={clientFilters.signals.includes(sig)}
                      onCheckedChange={(c) => toggleSignal(sig, c === true)}
                    />
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: SIGNAL_COLOR[sig] }}
                    />
                    {sig}
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Fundamentals */}
          <AccordionItem value="fundamentals" className="border-grid">
            <AccordionTrigger className="py-3 hover:no-underline">
              <GroupLabel>Fundamentals</GroupLabel>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pb-2">
                {(
                  [
                    ["needNews", "News catalyst"],
                    ["needEarnings", "Earnings ±3d"],
                    ["needHighShort", "High short interest"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2.5 font-mono text-xs text-ink-secondary hover:text-ink-primary"
                  >
                    <Checkbox
                      checked={clientFilters[key]}
                      onCheckedChange={(c) =>
                        onClientFilters({ ...clientFilters, [key]: c === true })
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Quant Score */}
          <AccordionItem value="quant" className="border-grid">
            <AccordionTrigger className="py-3 hover:no-underline">
              <GroupLabel>Quant Score</GroupLabel>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex items-center gap-3 pb-2">
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[filters.minScore]}
                  onValueChange={([v]) => set({ minScore: v ?? 0 })}
                  className={cn(
                    thumbTween,
                    "[&_[data-slot=slider-range]]:bg-quant [&_[data-slot=slider-thumb]]:border-quant",
                  )}
                />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-quant font-mono text-xs font-bold text-quant tabular-nums">
                  {filters.minScore}
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Watchlist */}
        {watchlist.length > 0 && (
          <div className="border-t border-grid pt-3">
            <div className="label-eyebrow mb-2 flex items-center gap-1.5 text-ink-secondary">
              <Star className="h-3 w-3 text-amber-watch" /> WATCHLIST
            </div>
            <div className="flex flex-wrap gap-1.5">
              {watchlist.map((sym) => (
                <span
                  key={sym}
                  className="group flex items-center gap-1 rounded-md border border-amber-watch/40 bg-amber-watch/[0.06] py-1 pl-2 pr-1 font-mono text-[10px] font-bold text-amber-watch"
                >
                  <button onClick={() => onSelect(sym)} className="hover:underline">
                    {sym}
                  </button>
                  <button
                    onClick={() => onRemoveWatch(sym)}
                    aria-label={`Remove ${sym}`}
                    className="rounded p-0.5 text-ink-muted opacity-0 transition-opacity hover:text-signal group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* My scans */}
        {savedScans.length > 0 && (
          <div className="border-t border-grid pt-3">
            <div className="label-eyebrow mb-2 text-ink-secondary">MY SCANS</div>
            <div className="flex flex-wrap gap-1.5">
              {savedScans.map((s) => (
                <button
                  key={s.name}
                  onClick={() => onApplyScan(s)}
                  className="rounded-md border border-quant/40 bg-quant/[0.06] px-2 py-1 font-mono text-[10px] text-quant transition-colors hover:bg-quant/[0.14]"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-grid px-4 py-3">
        <motion.div
          key={matched}
          initial={{ backgroundColor: "rgba(0,230,140,0.12)" }}
          animate={{ backgroundColor: "rgba(0,230,140,0)" }}
          transition={{ duration: 0.3 }}
          className="mb-2 rounded-md px-1"
        >
          <span className="font-mono text-2xl font-bold text-ink-primary tabular-nums">
            {matched.toLocaleString()}
          </span>
          <span className="ml-2 font-mono text-xs text-ink-muted">matches</span>
        </motion.div>
        <button
          onClick={() => setSaveOpen(true)}
          className="btn-shine flex w-full items-center justify-center gap-1.5 rounded-lg bg-pulse px-3 py-2 text-xs font-semibold text-abyss transition-all hover:brightness-110"
        >
          <Save className="h-3.5 w-3.5" /> Save Scan
        </button>
      </div>

      {/* Save dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="border-grid bg-carbon sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-ink-primary">Save this scan</DialogTitle>
          </DialogHeader>
          <input
            autoFocus
            value={scanName}
            onChange={(e) => setScanName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitSave()}
            placeholder="e.g. Afternoon momentum"
            className="h-9 w-full rounded-md border border-grid bg-abyss px-3 font-mono text-sm text-ink-primary placeholder:text-ink-muted focus:border-pulse/50 focus:outline-none"
          />
          <DialogFooter>
            <button
              onClick={submitSave}
              disabled={!scanName.trim()}
              className="rounded-lg bg-pulse px-4 py-2 text-xs font-semibold text-abyss transition-all hover:brightness-110 disabled:opacity-40"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
