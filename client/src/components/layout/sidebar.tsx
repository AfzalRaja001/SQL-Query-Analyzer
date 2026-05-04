"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { listConnections } from "@/lib/api";
import { useQueryStore } from "@/lib/store";
import {
  LayoutDashboard,
  Terminal,
  Gauge,
  GitCompareArrows,
  History,
  Database,
  BookOpen,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ready?: boolean;
};

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, ready: false },
  { href: "/analyze", label: "Analyzer", icon: Terminal, ready: true },
  { href: "/benchmark", label: "Benchmark", icon: Gauge, ready: false },
  { href: "/compare", label: "Compare", icon: GitCompareArrows, ready: false },
  { href: "/history", label: "History", icon: History, ready: false },
  { href: "/connections", label: "Connections", icon: Link2, ready: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { activeConnectionId } = useQueryStore();
  const { data: connections = [] } = useQuery({
    queryKey: ["connections"],
    queryFn: listConnections,
    staleTime: 30_000,
  });
  const activeConn = connections.find((c) => c.id === activeConnectionId);

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground ring-1 ring-primary/20 shadow-sm">
          <Database className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold tracking-[-0.01em]">
            QueryLab
          </span>
          <span className="text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground mt-0.5">
            SQL Analyzer
          </span>
        </div>
      </div>

      <div className="px-3 pt-4 pb-1 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
        Workspace
      </div>

      <nav className="flex-1 px-2 space-y-px">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              {active && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-primary"
                  aria-hidden
                />
              )}
              <span className="flex items-center gap-2.5">
                <Icon className="h-[14px] w-[14px]" />
                {item.label}
              </span>
              {!item.ready && (
                <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground rounded border border-border px-1.5 py-px">
                  soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-2">
        <a
          href="https://www.postgresql.org/docs/current/sql.html"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground transition-colors"
        >
          <BookOpen className="h-[14px] w-[14px]" />
          <span>SQL Reference</span>
        </a>
      </div>

      <div className="px-5 py-4 border-t border-border">
        <div className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
          Connection
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full shrink-0",
              activeConn ? "bg-sky-400" : "bg-[var(--sev-accent)]"
            )}
            style={
              !activeConn
                ? { boxShadow: "0 0 0 3px color-mix(in oklab, var(--sev-accent) 18%, transparent)" }
                : undefined
            }
          />
          <span className="font-mono text-[11.5px] text-foreground truncate">
            {activeConn ? activeConn.name : "Default DB"}
          </span>
        </div>
        <div className="mt-1 font-mono text-[10px] text-muted-foreground truncate">
          {activeConn
            ? `${activeConn.username}@${activeConn.host}/${activeConn.database}`
            : "readonly_user · queryanalyzer"}
        </div>
      </div>
    </aside>
  );
}
