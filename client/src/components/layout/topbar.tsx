"use client";

import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "./theme-toggle";
import { ConnectionPicker } from "./connection-picker";

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
        <h1 className="text-[13px] font-semibold tracking-[-0.01em]">
          {meta.title}
        </h1>
        <p className="text-[11.5px] text-muted-foreground mt-0.5">
          {meta.subtitle}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <ConnectionPicker />
        <Separator orientation="vertical" className="h-[18px]" />
        <span className="font-mono text-[11px] text-muted-foreground">
          v0.1.0
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
