"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Database } from "lucide-react";
import Link from "next/link";
import { listConnections } from "@/lib/api";
import { useQueryStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ConnectionPicker() {
  const { activeConnectionId, setActiveConnectionId } = useQueryStore();

  const { data: connections = [] } = useQuery({
    queryKey: ["connections"],
    queryFn: listConnections,
    staleTime: 30_000,
  });

  const active = connections.find((c) => c.id === activeConnectionId);
  const label = active ? active.name : "Default DB";

  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground hover:bg-muted transition-colors">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            activeConnectionId ? "bg-sky-400" : "bg-[var(--sev-accent)]"
          )}
        />
        <span className="max-w-[120px] truncate font-mono">{label}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-1.5 z-50 hidden group-focus-within:block group-hover:block w-52 rounded-lg border border-border bg-popover shadow-lg py-1">
        <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Switch connection
        </p>

        <button
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/60 transition-colors text-left",
            !activeConnectionId && "text-foreground font-medium"
          )}
          onClick={() => setActiveConnectionId(null)}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full shrink-0",
              !activeConnectionId ? "bg-[var(--sev-accent)]" : "bg-muted-foreground/30"
            )}
          />
          Default DB
          {!activeConnectionId && <span className="ml-auto text-[10px] text-muted-foreground">active</span>}
        </button>

        {connections.map((conn) => (
          <button
            key={conn.id}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/60 transition-colors text-left",
              activeConnectionId === conn.id && "text-foreground font-medium"
            )}
            onClick={() => setActiveConnectionId(conn.id)}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                activeConnectionId === conn.id ? "bg-sky-400" : "bg-muted-foreground/30"
              )}
            />
            <span className="truncate">{conn.name}</span>
            {activeConnectionId === conn.id && (
              <span className="ml-auto text-[10px] text-muted-foreground shrink-0">active</span>
            )}
          </button>
        ))}

        <div className="border-t border-border mt-1 pt-1">
          <Link
            href="/connections"
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <Database className="h-3 w-3" />
            Manage connections
          </Link>
        </div>
      </div>
    </div>
  );
}