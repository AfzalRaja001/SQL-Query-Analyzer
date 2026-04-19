"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Zap } from "lucide-react";
import type { PlanNode } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Severity = {
  accent: string;
  dot: string;
  variant: "success" | "warning" | "danger" | "info" | "default";
  label: string;
};

function severity(node: PlanNode): Severity {
  const cost = node["Total Cost"] ?? 0;
  const type = node["Node Type"] ?? "";

  if (type === "Seq Scan" && (node["Plan Rows"] ?? 0) > 1000) {
    return {
      accent: "before:bg-amber-500",
      dot: "bg-amber-500",
      variant: "warning",
      label: "warning",
    };
  }
  if (cost > 1000) {
    return {
      accent: "before:bg-rose-500",
      dot: "bg-rose-500",
      variant: "danger",
      label: "high cost",
    };
  }
  if (type.includes("Index")) {
    return {
      accent: "before:bg-emerald-500",
      dot: "bg-emerald-500",
      variant: "success",
      label: "indexed",
    };
  }
  return {
    accent: "before:bg-border",
    dot: "bg-muted-foreground/50",
    variant: "default",
    label: "ok",
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-xs font-medium tabular-nums">{value}</span>
    </div>
  );
}

function NodeCard({ node, depth = 0 }: { node: PlanNode; depth?: number }) {
  const [open, setOpen] = useState(true);
  const children = node.Plans ?? [];
  const sev = severity(node);

  return (
    <div
      className={cn(
        depth === 0
          ? ""
          : "relative pl-6 ml-3 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border"
      )}
    >
      <div
        className={cn(
          "relative rounded-lg border bg-card px-4 py-3 my-2 transition-all hover:shadow-[0_2px_10px_rgba(0,0,0,0.05)]",
          "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-full",
          sev.accent,
          "border-border"
        )}
      >
        <div className="flex items-center gap-2">
          {children.length > 0 ? (
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={open ? "Collapse" : "Expand"}
            >
              {open ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="h-3.5 w-3.5 inline-block" />
          )}
          <span className={cn("h-1.5 w-1.5 rounded-full", sev.dot)} />
          <div className="flex-1 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold tracking-tight">
              {node["Node Type"] ?? "Unknown Node"}
            </span>
            {node["Relation Name"] && (
              <span className="font-mono text-[11px] text-muted-foreground">
                on <span className="text-foreground/80">{node["Relation Name"]}</span>
              </span>
            )}
            {node["Index Name"] && (
              <span className="font-mono text-[11px] text-muted-foreground">
                using{" "}
                <span className="text-foreground/80">{node["Index Name"]}</span>
              </span>
            )}
            <Badge variant={sev.variant} className="ml-auto">
              {sev.label === "high cost" && <Zap className="h-2.5 w-2.5" />}
              {sev.label}
            </Badge>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 pl-5">
          <Stat label="Cost" value={(node["Total Cost"] ?? 0).toFixed(2)} />
          <Stat label="Est. Rows" value={String(node["Plan Rows"] ?? "—")} />
          <Stat
            label="Actual Rows"
            value={
              node["Actual Rows"] !== undefined
                ? String(node["Actual Rows"])
                : "—"
            }
          />
          <Stat
            label="Time (ms)"
            value={
              node["Actual Total Time"] !== undefined
                ? (node["Actual Total Time"] as number).toFixed(2)
                : "—"
            }
          />
        </div>

        {(node.Filter || node["Index Cond"]) && (
          <div className="mt-3 pl-5 flex flex-col gap-1">
            {node["Index Cond"] && (
              <div className="flex items-start gap-2">
                <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-medium pt-0.5">
                  index
                </span>
                <code className="text-[11px] font-mono text-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded">
                  {node["Index Cond"]}
                </code>
              </div>
            )}
            {node.Filter && (
              <div className="flex items-start gap-2">
                <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-medium pt-0.5">
                  filter
                </span>
                <code className="text-[11px] font-mono text-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded">
                  {node.Filter}
                </code>
              </div>
            )}
          </div>
        )}
      </div>

      {open &&
        children.map((child, i) => (
          <NodeCard key={i} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export function PlanTree({ plan }: { plan: PlanNode }) {
  return (
    <div className="text-sm">
      <NodeCard node={plan} />
    </div>
  );
}
