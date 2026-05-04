"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, AlertCircle, Clock, Rows2, ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  getHistory,
  toggleFavorite,
  type HistoryItem,
  type HistoryType,
  type HistorySort,
} from "@/lib/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return "just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours === 1) return "1h ago";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  if (years === 1) return "1 year ago";
  return `${years} years ago`;
}

function execTimeBadgeVariant(ms: number): "success" | "warning" | "danger" {
  if (ms < 100) return "success";
  if (ms < 500) return "warning";
  return "danger";
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20;

const TYPE_OPTIONS: { label: string; value: HistoryType }[] = [
  { label: "All", value: "all" },
  { label: "Slow (>200ms)", value: "slow" },
  { label: "Favorites", value: "favorites" },
];

const SORT_OPTIONS: { label: string; value: HistorySort }[] = [
  { label: "Newest", value: "newest" },
  { label: "Slowest", value: "slowest" },
  { label: "Fastest", value: "fastest" },
];

const EMPTY_MESSAGES: Record<HistoryType, string> = {
  all: "No query history yet. Run a query to get started.",
  slow: "No slow queries found. Your queries are all running fast!",
  favorites: "No favorites yet. Star a query to save it here.",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-12 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ type }: { type: HistoryType }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Clock className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">Nothing here</p>
      <p className="text-xs text-muted-foreground max-w-[280px]">
        {EMPTY_MESSAGES[type]}
      </p>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
      <div className="mt-0.5 h-6 w-6 shrink-0 rounded-md bg-destructive/10 text-destructive flex items-center justify-center">
        <AlertCircle className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-destructive">Failed to load history</div>
        <div className="font-mono text-xs mt-0.5 text-destructive/80 break-words">
          {message}
        </div>
      </div>
    </div>
  );
}

function HistoryRow({
  item,
  onToggleFavorite,
}: {
  item: HistoryItem;
  onToggleFavorite: (id: string | number) => void;
}) {
  const badgeVariant = execTimeBadgeVariant(item.executionTimeMs);
  const suggestionCount = item.suggestions?.length ?? 0;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          {/* SQL text */}
          <div className="flex-1 min-w-0">
            <pre
              className={cn(
                "font-mono text-xs leading-relaxed text-foreground",
                "line-clamp-2 whitespace-pre-wrap break-all"
              )}
            >
              {item.sqlText}
            </pre>

            {/* Stats row */}
            <div className="flex items-center flex-wrap gap-2 mt-2.5">
              {/* Execution time */}
              <Badge variant={badgeVariant} className="gap-1">
                <Clock className="h-2.5 w-2.5" />
                {item.executionTimeMs < 1
                  ? `<1 ms`
                  : `${item.executionTimeMs.toFixed(1)} ms`}
              </Badge>

              {/* Row count */}
              <Badge variant="default" className="gap-1">
                <Rows2 className="h-2.5 w-2.5" />
                {item.rowCount.toLocaleString()} rows
              </Badge>

              {/* Timestamp */}
              <span className="text-[11px] text-muted-foreground">
                {timeAgo(item.createdAt)}
              </span>

              {/* Suggestions count */}
              {suggestionCount > 0 && (
                <Badge variant="warning" className="gap-1">
                  {suggestionCount} suggestion{suggestionCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>

          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite(item.id)}
            aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
            className={cn(
              "shrink-0 h-7 w-7 rounded-lg flex items-center justify-center",
              "transition-colors outline-none",
              "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
              item.isFavorite
                ? "text-amber-500 hover:text-amber-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Star
              className={cn(
                "h-4 w-4",
                item.isFavorite && "fill-current"
              )}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function HistoryClient() {
  const [activeType, setActiveType] = useState<HistoryType>("all");
  const [activeSort, setActiveSort] = useState<HistorySort>("newest");

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchHistory = useCallback(
    async (type: HistoryType, sort: HistorySort, currentOffset: number, append: boolean) => {
      try {
        const result = await getHistory({
          type,
          sort,
          limit: PAGE_LIMIT,
          offset: currentOffset,
        });

        setItems((prev) => (append ? [...prev, ...result.data] : result.data));
        setHasMore(result.meta.hasMore);
        setError(null);
      } catch (err) {
        const e = err as { message?: string };
        setError(e.message || "An unexpected error occurred");
      }
    },
    []
  );

  // Initial load and re-fetch when type/sort changes
  useEffect(() => {
    setLoading(true);
    setOffset(0);
    setItems([]);

    fetchHistory(activeType, activeSort, 0, false).finally(() => {
      setLoading(false);
    });
  }, [activeType, activeSort, fetchHistory]);

  // ── Load more ────────────────────────────────────────────────────────────────

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    const nextOffset = offset + PAGE_LIMIT;
    setLoadingMore(true);
    setOffset(nextOffset);

    await fetchHistory(activeType, activeSort, nextOffset, true);
    setLoadingMore(false);
  }, [loadingMore, hasMore, offset, activeType, activeSort, fetchHistory]);

  // ── Favorite toggle (optimistic) ─────────────────────────────────────────────

  const handleToggleFavorite = useCallback(async (id: string | number) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );

    try {
      const result = await toggleFavorite(id);
      // Sync with server truth
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isFavorite: result.isFavorite } : item
        )
      );
    } catch {
      // Revert on error
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
        )
      );
    }
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* ── Header ── */}
      <Card>
        <CardHeader>
          <CardTitle>Query History</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4 pb-4">
          {/* Type filter button group */}
          <div
            data-slot="button-group"
            className="flex items-center rounded-lg border border-border overflow-hidden shrink-0"
          >
            {TYPE_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setActiveType(value)}
                className={cn(
                  "h-8 px-3 text-sm font-medium transition-colors whitespace-nowrap",
                  "border-r border-border last:border-r-0",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  activeType === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort select */}
          <div className="relative flex items-center">
            <select
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value as HistorySort)}
              className={cn(
                "h-8 appearance-none rounded-lg border border-border bg-background",
                "pl-3 pr-8 text-sm text-foreground",
                "transition-colors hover:bg-muted",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
                "cursor-pointer"
              )}
            >
              {SORT_OPTIONS.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* ── Content ── */}
      <div className="flex flex-col gap-2.5">
        {/* Error state */}
        {error && !loading && <ErrorCard message={error} />}

        {/* Loading skeletons */}
        {loading && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {/* History items */}
        {!loading &&
          !error &&
          items.map((item) => (
            <HistoryRow
              key={item.id}
              item={item}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <EmptyState type={activeType} />
        )}

        {/* Load more */}
        {!loading && hasMore && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="min-w-[120px]"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
