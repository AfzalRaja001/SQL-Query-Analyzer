"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type Severity = "warning" | "info" | "danger";

type Suggestion = {
  sev: Severity;
  title: string;
  body: string;
  category: string;
  sql?: string;
};

const toneMap: Record<
  Severity,
  { dot: string; fg: string; bg: string }
> = {
  warning: {
    dot: "bg-[var(--sev-warn)]",
    fg: "text-[var(--sev-warn)]",
    bg: "bg-[var(--sev-warn-bg)]",
  },
  info: {
    dot: "bg-muted-foreground",
    fg: "text-muted-foreground",
    bg: "bg-muted",
  },
  danger: {
    dot: "bg-[var(--sev-danger)]",
    fg: "text-[var(--sev-danger)]",
    bg: "bg-[var(--sev-danger-bg)]",
  },
};

/* ================= MAIN CARD ================= */

function FinalSuggestion({ s }: { s: Suggestion }) {
  const tone = toneMap[s.sev];
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!s.sql) return;
    await navigator.clipboard.writeText(s.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="mb-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("h-2 w-2 rounded-full", tone.dot)} />
        <span className="text-sm font-semibold">Optimized Query</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--sev-accent-bg)] text-[var(--sev-accent)] ml-auto">
          FINAL
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        Best version of your query after applying optimizations.
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <code className="font-mono text-[12px] bg-muted px-3 py-2 rounded-md">
          {s.sql}
        </code>

        <button
          onClick={copy}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

/* ================= ISSUE LIST ================= */

function IssueItem({ s }: { s: Suggestion }) {
  const tone = toneMap[s.sev];

  return (
    <div className="flex gap-3 py-3 border-b border-border last:border-none">
      <span className={cn("mt-1.5 h-2 w-2 rounded-full", tone.dot)} />
      <div>
        <div className="text-sm font-medium">{s.title}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {s.body}
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN PANEL ================= */

export function SuggestionsPanel({
  items,
}: {
  items?: Suggestion[];
}) {
  const safe = items ?? [];

  const final = safe.find((s) => s.title === "Optimized Query");
  const issues = safe.filter((s) => s.title !== "Optimized Query");

  if (!safe.length) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No suggestions for this query.
      </div>
    );
  }

  return (
    <div className="py-2">

      {/* 🔥 FINAL CLEAN CARD */}
      {final && <FinalSuggestion s={final} />}

      {/* 🔻 ISSUES (minimal) */}
      {issues.length > 0 && (
        <div className="rounded-lg border border-border bg-card px-4">
          <div className="text-xs uppercase text-muted-foreground py-3">
            Issues detected
          </div>

          {issues.map((s, i) => (
            <IssueItem key={i} s={s} />
          ))}
        </div>
      )}

    </div>
  );
}