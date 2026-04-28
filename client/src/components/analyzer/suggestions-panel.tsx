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

// Placeholder (only used if nothing is passed at all)
const PLACEHOLDER: Suggestion[] = [
  {
    sev: "info",
    title: "Optimization engine pending",
    body: "Run Analyze to generate query optimization suggestions.",
    category: "Info",
  },
];

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

/**
 * 🔧 Enhance suggestions (logic only, no UI changes)
 */
function enhanceSuggestions(items: Suggestion[]): Suggestion[] {
  return items.map((s) => {
    // Auto-fill simple optimization if missing
    if (!s.sql && s.title.toLowerCase().includes("select *")) {
      return {
        ...s,
        sql: "SELECT column1, column2 FROM table_name;",
      };
    }
    return s;
  });
}

function SuggestionItem({
  s,
  last,
}: {
  s: Suggestion;
  last: boolean;
}) {
  const tone = toneMap[s.sev];
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!s.sql) return;
    try {
      await navigator.clipboard.writeText(s.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className={cn(
        "flex gap-[14px] px-4 py-[14px]",
        !last && "border-b border-border"
      )}
    >
      <span
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          tone.dot
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold tracking-[-0.005em]">
            {s.title}
          </span>
          <span
            className={cn(
              "text-[9.5px] uppercase tracking-[0.14em] font-medium px-[7px] py-0.5 rounded",
              tone.bg,
              tone.fg
            )}
          >
            {s.category}
          </span>
        </div>

        <p
          className="mt-1.5 text-[12.5px] text-muted-foreground leading-[1.55]"
          style={{ textWrap: "pretty" }}
        >
          {s.body}
        </p>

        {s.sql && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <code className="font-mono text-[11.5px] bg-muted text-foreground px-2.5 py-[5px] rounded-md">
              {s.sql}
            </code>

            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-md hover:bg-muted transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function SuggestionsPanel({
  items,
}: {
  items?: Suggestion[];
}) {
  // If backend sends nothing → empty array
  const safeItems = items ?? [];

  // Enhance suggestions (logic layer)
  const processed = enhanceSuggestions(safeItems);

  // Empty state (NO placeholder spam)
  if (processed.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No suggestions for this query.
      </div>
    );
  }

  return (
    <div className="py-2">
      {processed.map((s, i) => (
        <SuggestionItem key={i} s={s} last={i === processed.length - 1} />
      ))}
    </div>
  );
}