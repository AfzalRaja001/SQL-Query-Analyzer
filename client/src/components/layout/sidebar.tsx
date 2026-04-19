"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Terminal,
  Gauge,
  GitCompareArrows,
  History,
  Database,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground ring-1 ring-primary/20 shadow-sm">
          <Database className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">QueryLab</span>
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            SQL Analyzer
          </span>
        </div>
      </div>

      <div className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80 font-medium">
        Workspace
      </div>

      <nav className="flex-1 px-2 space-y-0.5">
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
                "group relative flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-xs"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-primary" />
              )}
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              {!item.ready && (
                <Badge variant="outline" className="text-[9px]">
                  soon
                </Badge>
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
          <BookOpen className="h-4 w-4" />
          <span>SQL Reference</span>
        </a>
      </div>

      <div className="px-5 py-4 border-t border-border">
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80 mb-1.5">
          Connection
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/50 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-foreground/80">readonly_user</span>
        </div>
        <div className="mt-1 font-mono text-[10px] text-muted-foreground">
          postgres · queryanalyzer
        </div>
      </div>
    </aside>
  );
}
