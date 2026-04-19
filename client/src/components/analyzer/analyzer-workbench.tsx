"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Play,
  Loader2,
  Sparkles,
  AlertCircle,
  Eraser,
  Terminal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Kbd } from "@/components/ui/kbd";

import { SqlEditor } from "./sql-editor";
import { MetricsBar } from "./metrics-bar";
import { ResultsTable } from "./results-table";
import { PlanTree } from "./plan-tree";
import { SuggestionsPanel } from "./suggestions-panel";
import { executeQuery, type ExecuteResponse } from "@/lib/api";
import { useQueryStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Tab = "results" | "plan" | "suggestions";

export function AnalyzerWorkbench() {
  const { query, analyze, setQuery, setAnalyze } = useQueryStore();
  const [tab, setTab] = useState<Tab>("results");

  const mutation = useMutation<ExecuteResponse, Error, { analyze: boolean }>({
    mutationFn: ({ analyze }) => executeQuery(query, analyze),
  });

  const result = mutation.data;
  const isSuccess = result?.success === true;
  const errorMsg =
    result?.success === false
      ? result.error
      : mutation.error
      ? mutation.error.message
      : null;

  function run(withAnalyze: boolean) {
    setAnalyze(withAnalyze);
    mutation.mutate({ analyze: withAnalyze });
    setTab(withAnalyze ? "plan" : "results");
  }

  function onEditorKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      run(e.shiftKey);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Editor card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
              <Terminal className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-0.5">
              <CardTitle>Query</CardTitle>
              <CardDescription>
                Read-only. SELECT / WITH statements only. 10s timeout.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-muted-foreground mr-1">
              <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd>
              <span>run</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery("")}
              disabled={mutation.isPending || !query}
            >
              <Eraser />
              Clear
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => run(true)}
              disabled={mutation.isPending || !query.trim()}
            >
              {mutation.isPending && analyze ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              Analyze
            </Button>
            <Button
              size="sm"
              onClick={() => run(false)}
              disabled={mutation.isPending || !query.trim()}
            >
              {mutation.isPending && !analyze ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Play />
              )}
              Run
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4" onKeyDown={onEditorKeyDown}>
          <SqlEditor value={query} onChange={setQuery} />
        </CardContent>
      </Card>

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="mt-0.5 h-6 w-6 shrink-0 rounded-md bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertCircle className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-destructive">Execution failed</div>
            <div className="font-mono text-xs mt-0.5 text-destructive/80 break-words">
              {errorMsg}
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      {isSuccess && result && <MetricsBar result={result} />}

      {/* Output panels */}
      <Card>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as Tab)}
          className="contents"
        >
          <CardHeader className="!py-2.5">
            <TabsList>
              <TabsIndicator />
              <TabsTrigger value="results">
                Results
                {isSuccess && result && (
                  <Badge variant="outline" className="ml-1 font-mono tracking-normal">
                    {result.rowCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="plan">
                Execution Plan
                {isSuccess && result?.executionPlan && (
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                )}
              </TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>running…</span>
                </>
              ) : isSuccess && result ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{result.executionTimeMs.toFixed(2)} ms</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  <span>idle</span>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent
            className={cn(
              "min-h-[340px]",
              tab === "results" && isSuccess && result?.data?.length
                ? "p-0"
                : "p-5"
            )}
          >
            <TabsContent value="results">
              {mutation.isPending ? (
                <LoadingState />
              ) : result && isSuccess ? (
                <ResultsTable result={result} />
              ) : (
                <EmptyState />
              )}
            </TabsContent>

            <TabsContent value="plan">
              {mutation.isPending ? (
                <LoadingState />
              ) : result && isSuccess ? (
                result.executionPlan ? (
                  <PlanTree plan={result.executionPlan} />
                ) : (
                  <NoPlanState />
                )
              ) : (
                <EmptyState />
              )}
            </TabsContent>

            <TabsContent value="suggestions">
              <SuggestionsPanel />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="relative">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Play className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="absolute -inset-2 rounded-full border border-dashed border-border animate-pulse" />
      </div>
      <div>
        <div className="text-sm font-semibold">Ready when you are</div>
        <p className="mx-auto max-w-sm mt-1 text-xs text-muted-foreground">
          Click <span className="font-medium text-foreground">Run</span> to
          execute, or{" "}
          <span className="font-medium text-foreground">Analyze</span> to also
          capture the execution plan.
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Kbd>⌘</Kbd>
        <Kbd>↵</Kbd>
        <span>run</span>
        <span className="mx-1 text-muted-foreground/50">·</span>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>↵</Kbd>
        <span>analyze</span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-xs">Executing query…</span>
    </div>
  );
}

function NoPlanState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium">No plan captured</div>
      <p className="max-w-xs text-xs text-muted-foreground">
        Click{" "}
        <span className="font-medium text-foreground">Analyze</span> to collect
        EXPLAIN ANALYZE output for this query.
      </p>
    </div>
  );
}
