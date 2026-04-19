"use client";

/**
 * SqlEditor — temporary textarea-based shell.
 *
 * Monaco is being integrated separately. Keep `value` / `onChange` / `readOnly`
 * stable so the Monaco version can be swapped in without touching callers.
 */

import { cn } from "@/lib/utils";
import { useMemo } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
};

export function SqlEditor({
  value,
  onChange,
  readOnly,
  className,
  placeholder,
}: Props) {
  const lineCount = useMemo(
    () => Math.max(value.split("\n").length, 12),
    [value]
  );

  return (
    <div
      className={cn(
        "group relative flex min-h-[300px] overflow-hidden rounded-md border border-border bg-muted/30 focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-ring/60 transition-all",
        className
      )}
    >
      {/* gutter */}
      <div
        aria-hidden
        className="select-none border-r border-border bg-muted/40 px-3 py-4 font-mono text-[12px] leading-6 text-muted-foreground/60 text-right tabular-nums"
      >
        {Array.from({ length: lineCount }).map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      <textarea
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className={cn(
          "flex-1 resize-none bg-transparent font-mono text-[13px] leading-6 px-4 py-4 outline-none",
          "text-foreground placeholder:text-muted-foreground/60"
        )}
      />

      <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-mono">
        <span>sql</span>
        <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
        <span>readonly mode</span>
      </div>
    </div>
  );
}
