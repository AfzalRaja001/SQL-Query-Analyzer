"use client";

import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Dashboard",
    subtitle: "Overview of recent queries and performance trends.",
  },
  "/analyze": {
    title: "Analyzer",
    subtitle: "Run SQL, inspect execution plans, and capture metrics.",
  },
  "/benchmark": {
    title: "Benchmark",
    subtitle: "Iterate queries to measure stability and variance.",
  },
  "/compare": {
    title: "Compare",
    subtitle: "Run two queries side-by-side and diff their plans.",
  },
  "/history": {
    title: "History",
    subtitle: "Browse past executions and saved queries.",
  },
};

export function Topbar() {
  const pathname = usePathname();
  const meta =
    TITLES[pathname] ||
    Object.entries(TITLES).find(
      ([k]) => k !== "/" && pathname.startsWith(k)
    )?.[1] ||
    TITLES["/"];

  return (
    <header className="h-14 shrink-0 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-6 sticky top-0 z-10">
      <div className="flex flex-col leading-tight">
        <h1 className="text-sm font-semibold tracking-tight">{meta.title}</h1>
        <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Badge variant="success" className="normal-case tracking-normal">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          API connected
        </Badge>
        <Separator orientation="vertical" className="h-5" />
        <span className="font-mono text-[11px] text-muted-foreground">
          v0.1.0
        </span>
      </div>
    </header>
  );
}
