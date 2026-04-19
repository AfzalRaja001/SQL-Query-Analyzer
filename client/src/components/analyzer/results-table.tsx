"use client";

import type { ExecuteSuccess } from "@/lib/api";
import { cn } from "@/lib/utils";

function renderCell(value: unknown): { text: string; nullish: boolean } {
  if (value === null || value === undefined) return { text: "NULL", nullish: true };
  if (typeof value === "object") return { text: JSON.stringify(value), nullish: false };
  return { text: String(value), nullish: false };
}

export function ResultsTable({ result }: { result: ExecuteSuccess }) {
  const rows = result.data ?? [];
  const columns =
    result.fields?.map((f) => f.name) ??
    (rows[0] ? Object.keys(rows[0]) : []);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
        </div>
        <div className="text-sm font-medium">No rows returned</div>
        <p className="mt-1 text-xs text-muted-foreground">
          The query executed successfully but produced an empty result set.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[480px]">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="sticky left-0 z-20 bg-muted/90 backdrop-blur text-left font-medium text-[10px] uppercase tracking-[0.14em] text-muted-foreground px-3 py-2.5 border-b border-border w-12">
              #
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="bg-muted/90 backdrop-blur text-left font-medium text-[10px] uppercase tracking-[0.14em] text-muted-foreground px-3 py-2.5 border-b border-border whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={cn(
                "transition-colors hover:bg-muted/40",
                i % 2 === 1 && "bg-muted/15"
              )}
            >
              <td className="sticky left-0 bg-inherit px-3 py-2 text-xs text-muted-foreground font-mono tabular-nums border-b border-border/50">
                {i + 1}
              </td>
              {columns.map((col) => {
                const { text, nullish } = renderCell(
                  (row as Record<string, unknown>)[col]
                );
                return (
                  <td
                    key={col}
                    className="px-3 py-2 font-mono text-[12.5px] whitespace-nowrap max-w-[360px] overflow-hidden text-ellipsis border-b border-border/50"
                    title={text}
                  >
                    {nullish ? (
                      <span className="text-muted-foreground/60 italic">
                        NULL
                      </span>
                    ) : (
                      text
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
