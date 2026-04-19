"use client";

import { Lightbulb, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PLANNED = [
  "Avoid SELECT * on wide tables",
  "Flag Seq Scan on > 1k rows",
  "Detect nested loop blowups",
  "Suggest index creation from Filter clauses",
];

export function SuggestionsPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="relative h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Lightbulb className="h-5 w-5 text-muted-foreground" />
        <Sparkles className="absolute -top-0.5 -right-0.5 h-3 w-3 text-amber-500" />
      </div>
      <div>
        <div className="text-sm font-semibold">Optimization engine pending</div>
        <p className="mx-auto max-w-sm mt-1 text-xs text-muted-foreground">
          Rule-based suggestions will surface here once the optimization service
          lands in Phase 5.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md">
        {PLANNED.map((p) => (
          <Badge key={p} variant="outline" className="normal-case tracking-normal font-normal">
            {p}
          </Badge>
        ))}
      </div>
    </div>
  );
}
