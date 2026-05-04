"use client";

import { useState, useCallback } from "react";
import { Loader2, GitCompareArrows, AlertCircle, Trophy, Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  compareQueries,
  type CompareResponse,
  type CompareSuccess,
  type ParsedPlanNode,
} from "@/lib/api";

// ── Default SQL values ────────────────────────────────────────────────────────

const DEFAULT_QUERY_A =
  "SELECT * FROM information_schema.tables WHERE table_schema = 'public';";
const DEFAULT_QUERY_B =
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';";

// ── Plan node recursive component ─────────────────────────────────────────────

function PlanNode({ node, depth = 0 }: { node: ParsedPlanNode; depth?: number }) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div
      className={cn(
        "relative",
        depth > 0 &&
          "pl-4 ml-3 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border"
      )}
    >
      <div className="rounded-lg border border-border bg-card my-1.5 px-3 py-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span className="text-[12px] font-semibold text-foreground">
            {node.nodeType}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
              Cost
            </div>
            <div className="font-mono text-[11px] font-medium tabular-nums mt-0.5">
              {node.totalCost.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
              Est. Rows
            </div>
            <div className="font-mono text-[11px] font-medium tabular-nums mt-0.5">
              {node.estimatedRows.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
              Time (ms)
            </div>
            <div className="font-mono text-[11px] font-medium tabular-nums mt-0.5">
              {node.actualTimeMs > 0 ? node.actualTimeMs.toFixed(2) : "—"}
            </div>
          </div>
        </div>
      </div>

      {hasChildren &&
        node.children.map((child, i) => (
          <PlanNode key={i} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

// ── Stat item ─────────────────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

// ── Editor card ───────────────────────────────────────────────────────────────

function EditorCard({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Card className="flex-1 min-w-0 flex flex-col">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <Badge variant="outline" className="ml-auto">
          SQL
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          rows={6}
          className={cn(
            "w-full h-full min-h-[140px] resize-none rounded-b-xl bg-transparent px-5 py-4",
            "font-mono text-sm leading-relaxed text-foreground",
            "outline-none placeholder:text-muted-foreground"
          )}
          placeholder="Enter SQL query…"
        />
      </CardContent>
    </Card>
  );
}

// ── Winner banner ─────────────────────────────────────────────────────────────

function WinnerBanner({ result }: { result: CompareSuccess }) {
  const { winner, diffPercentage } = result;

  const isTie = winner === "tie";
  const label =
    winner === "queryA"
      ? "Query A wins"
      : winner === "queryB"
      ? "Query B wins"
      : "Tie";

  return (
    <Card
      className={cn(
        "border",
        isTie
          ? "border-border"
          : winner === "queryA"
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-sky-500/40 bg-sky-500/5"
      )}
    >
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          {isTie ? (
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Minus className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <div
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                winner === "queryA"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
              )}
            >
              <Trophy className="h-4 w-4" />
            </div>
          )}
          <div>
            <div className="text-sm font-semibold leading-tight">{label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {isTie
                ? "Both queries performed equally"
                : `${diffPercentage.toFixed(1)}% faster`}
            </div>
          </div>
        </div>

        <Badge
          variant={
            isTie
              ? "default"
              : winner === "queryA"
              ? "success"
              : "info"
          }
          className="text-[11px] px-2.5 py-1"
        >
          {isTie ? "tie" : `${diffPercentage.toFixed(1)}% diff`}
        </Badge>
      </CardContent>
    </Card>
  );
}

// ── Stats card ────────────────────────────────────────────────────────────────

function StatsCard({
  label,
  result,
  isWinner,
}: {
  label: string;
  result: CompareSuccess["resultsA"];
  isWinner: boolean;
}) {
  return (
    <Card
      className={cn(
        "flex-1 min-w-0",
        isWinner && "border-emerald-500/30"
      )}
    >
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        {isWinner && <Badge variant="success">winner</Badge>}
      </CardHeader>
      <CardContent>
        <StatRow
          label="Execution Time"
          value={`${result.executionTimeMs.toFixed(1)} ms`}
        />
        <StatRow
          label="Total Cost"
          value={result.totalCost.toFixed(2)}
        />
        <StatRow
          label="Estimated Rows"
          value={result.plan.estimatedRows.toLocaleString()}
        />
      </CardContent>
    </Card>
  );
}

// ── Plan tree card ────────────────────────────────────────────────────────────

function PlanTreeCard({
  label,
  plan,
}: {
  label: string;
  plan: ParsedPlanNode;
}) {
  return (
    <Card className="flex-1 min-w-0">
      <CardHeader>
        <CardTitle>{label} — Execution Plan</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto max-h-[480px]">
        <PlanNode node={plan} />
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CompareClient() {
  const [queryA, setQueryA] = useState(DEFAULT_QUERY_A);
  const [queryB, setQueryB] = useState(DEFAULT_QUERY_B);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareSuccess | null>(null);

  const handleCompare = useCallback(async () => {
    if (!queryA.trim() || !queryB.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response: CompareResponse = await compareQueries(queryA, queryB);
      if (response.success) {
        setResult(response);
      } else {
        setError(response.error);
      }
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [queryA, queryB, loading]);

  const winnerA = result?.winner === "queryA";
  const winnerB = result?.winner === "queryB";

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* ── Editors ── */}
      <div className="flex gap-4 items-stretch">
        <EditorCard label="Query A" value={queryA} onChange={setQueryA} />
        <EditorCard label="Query B" value={queryB} onChange={setQueryB} />
      </div>

      {/* ── Compare button ── */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleCompare}
          disabled={loading || !queryA.trim() || !queryB.trim()}
          className="gap-2 min-w-[140px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Comparing…
            </>
          ) : (
            <>
              <GitCompareArrows className="h-4 w-4" />
              Compare
            </>
          )}
        </Button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="mt-0.5 h-6 w-6 shrink-0 rounded-md bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertCircle className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-destructive">Comparison failed</div>
            <div className="font-mono text-xs mt-0.5 text-destructive/80 break-words">
              {error}
            </div>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div className="flex flex-col gap-4">
          {/* Winner banner */}
          <WinnerBanner result={result} />

          {/* Stats */}
          <div className="flex gap-4">
            <StatsCard
              label="Query A"
              result={result.resultsA}
              isWinner={winnerA}
            />
            <StatsCard
              label="Query B"
              result={result.resultsB}
              isWinner={winnerB}
            />
          </div>

          {/* Plan trees */}
          <div className="flex gap-4 items-start">
            <PlanTreeCard label="Query A" plan={result.resultsA.plan} />
            <PlanTreeCard label="Query B" plan={result.resultsB.plan} />
          </div>
        </div>
      )}
    </div>
  );
}
