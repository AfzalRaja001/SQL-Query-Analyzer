"use client";

import { Clock, Rows, ListTree, CheckCircle2 } from "lucide-react";
import type { ExecuteSuccess } from "@/lib/api";
import { cn } from "@/lib/utils";

function Metric({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="group flex-1 min-w-[150px] rounded-xl border border-border bg-card px-4 py-3 transition-all hover:border-foreground/25 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-md bg-muted",
            accent
          )}
        >
          <Icon className="h-3 w-3" />
        </div>
        <span className="uppercase tracking-[0.14em] text-[10px]">
          {label}
        </span>
      </div>
      <div className="mt-1.5 font-mono text-xl font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

export function MetricsBar({ result }: { result: ExecuteSuccess }) {
  const cols = result.fields?.length ?? 0;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Metric
        label="Status"
        value="Success"
        icon={CheckCircle2}
        accent="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      />
      <Metric
        label="Exec Time"
        value={`${result.executionTimeMs.toFixed(2)} ms`}
        icon={Clock}
      />
      <Metric label="Rows" value={String(result.rowCount ?? 0)} icon={Rows} />
      <Metric label="Columns" value={String(cols)} icon={ListTree} />
    </div>
  );
}
