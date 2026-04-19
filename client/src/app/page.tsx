import Link from "next/link";
import {
  ArrowRight,
  Terminal,
  Gauge,
  GitCompareArrows,
  History,
  TrendingUp,
  Clock,
  Database,
  AlertTriangle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATS = [
  { label: "Total Queries", value: "—", icon: Database },
  { label: "Avg Exec Time", value: "—", icon: Clock },
  { label: "Slow Queries", value: "—", icon: AlertTriangle },
  { label: "Trends", value: "—", icon: TrendingUp },
];

const LINKS = [
  {
    href: "/analyze",
    title: "Analyzer",
    desc: "Write SQL, inspect execution plans, capture metrics.",
    icon: Terminal,
    ready: true,
  },
  {
    href: "/benchmark",
    title: "Benchmark",
    desc: "Iterate queries to study variance and stability.",
    icon: Gauge,
    ready: false,
  },
  {
    href: "/compare",
    title: "Compare",
    desc: "Run two queries side by side and diff their plans.",
    icon: GitCompareArrows,
    ready: false,
  },
  {
    href: "/history",
    title: "History",
    desc: "Browse every past execution and save favorites.",
    icon: History,
    ready: false,
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl flex flex-col gap-8">
      {/* Hero */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="normal-case tracking-normal font-normal">
            v0.1.0 · preview
          </Badge>
          <Badge variant="info" className="normal-case tracking-normal font-normal">
            Phase 2 · Execution engine live
          </Badge>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Analyze, benchmark, and optimize your SQL.
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl">
          A workbench for writing queries, inspecting Postgres execution plans,
          and surfacing optimization opportunities. Run it against any schema
          your readonly role can see.
        </p>
        <div className="mt-3">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors"
          >
            Open Analyzer
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card px-4 py-3.5"
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <Icon className="h-3 w-3" />
                {s.label}
              </div>
              <div className="mt-1.5 font-mono text-xl font-semibold tabular-nums">
                {s.value}
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                awaiting history service
              </div>
            </div>
          );
        })}
      </section>

      {/* Feature cards */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Modules</h3>
            <p className="text-xs text-muted-foreground">
              Each module maps to a phase in the implementation plan.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <Link key={l.href} href={l.href} className="group">
                <Card className="h-full transition-all hover:border-foreground/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <CardTitle>{l.title}</CardTitle>
                        <CardDescription>{l.desc}</CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
                  </CardHeader>
                  <CardContent className="py-3">
                    {l.ready ? (
                      <Badge variant="success" className="normal-case tracking-normal font-normal">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="normal-case tracking-normal font-normal">
                        Coming soon
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
