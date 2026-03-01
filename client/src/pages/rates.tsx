import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  LineChart,
  RefreshCw,
  ArrowLeft,
  Search,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchMedianFxRates } from "@/services/medianFxRatesService";
import type { MedianRateEntry } from "@/services/medianFxRatesService";

const POLL_MS = import.meta.env.VITE_RATES_POLL_INTERVAL_MS
  ? Number(import.meta.env.VITE_RATES_POLL_INTERVAL_MS)
  : import.meta.env.DEV
    ? 30 * 60 * 1000
    : 60 * 1000;

function formatTimeAgo(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function RateRow({ entry }: { entry: MedianRateEntry }) {
  const bySourceLines = Object.entries(entry.bySource)
    .map(([id, rate]) => `${id}: ${rate.toFixed(4)}`)
    .join("\n");

  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3 hover:border-primary/30 transition-colors">
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {entry.pair}
        </span>
        <span className="text-xs text-muted-foreground">
          {entry.sourceCount} source{entry.sourceCount !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold tracking-tight text-foreground tabular-nums">
          {entry.median.toFixed(4)}
        </span>
        {bySourceLines && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-white/10"
                  aria-label="Per-source rates"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {bySourceLines}
                </pre>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

export default function RatesPage() {
  const [search, setSearch] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["median-fx-rates"],
    queryFn: fetchMedianFxRates,
    refetchInterval: POLL_MS,
    staleTime: Math.min(POLL_MS / 2, 60 * 1000),
  });

  const filteredPairs = useMemo(() => {
    if (!data?.pairs) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.pairs;
    return data.pairs.filter(
      (p) =>
        p.toLowerCase().includes(q) ||
        p.replace("USD/", "").toLowerCase().includes(q)
    );
  }, [data?.pairs, search]);

  const lastUpdatedAgo = dataUpdatedAt
    ? formatTimeAgo(Date.now() - dataUpdatedAt)
    : null;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/wallet">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <LineChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Live Median FX Rates
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Aggregated from multiple sources (median). No oracle cost for
                  viewing.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {lastUpdatedAgo && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdatedAgo}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-white/10"
              onClick={() => refetch()}
              disabled={isRefetching || isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {data && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {data.sourcesUsed}/{data.sourcesTotal} sources
            </span>
            <span>·</span>
            <span>{data.pairs.length} pairs</span>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by pair or currency (e.g. NGN, GHS, USD/JPY)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-white/10 bg-card/50 h-11"
          />
        </div>

        <Card className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm overflow-hidden">
          <CardContent className="pt-5 pb-4 px-5 sm:px-6">
            {isLoading && !data && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-16 rounded-xl bg-white/5"
                  />
                ))}
              </div>
            )}

            {isError && !data && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-6 text-center">
                <p className="text-sm font-medium text-red-200">
                  Failed to load rates
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(error as Error)?.message || "Check your network and API keys."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Retry
                </Button>
              </div>
            )}

            {data && data.pairs.length === 0 && (
              <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No rates available. Add API keys in .env for FastForex,
                  exchangerate.host, and exchangerate-api.
                </p>
              </div>
            )}

            {data && data.pairs.length > 0 && filteredPairs.length === 0 && (
              <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No pairs match &quot;{search}&quot;
                </p>
              </div>
            )}

            {data &&
              data.pairs.length > 0 &&
              filteredPairs.length > 0 &&
              !isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[70vh] overflow-y-auto pr-1">
                  {filteredPairs.map((pair) => {
                    const entry = data.rates[pair];
                    if (!entry) return null;
                    return <RateRow key={pair} entry={entry} />;
                  })}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
