import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MiniPlan } from "@/components/landing/mini-plan";

const MODULES = [
  {
    num: "01",
    title: "Analyzer",
    desc: "Run SELECT, capture EXPLAIN ANALYZE, render a plan tree.",
    available: true,
  },
  {
    num: "02",
    title: "Benchmark",
    desc: "Loop a query N times, get min / avg / max with variance.",
    available: true,
  },
  {
    num: "03",
    title: "Compare",
    desc: "Two editors, two plans, one diff. Pick the winner.",
    available: true,
  },
  {
    num: "04",
    title: "History",
    desc: "Every execution, searchable, favoritable.",
    available: true,
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-[960px] py-12 pb-16">
      {/* Eyebrow */}
      <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <span className="h-px w-[18px] bg-border-strong" aria-hidden />
        Postgres workbench · v0.1
      </div>

      {/* Headline */}
      <h1
        className="mt-[22px] font-medium text-foreground max-w-[780px]"
        style={{
          fontSize: 56,
          lineHeight: 1.02,
          letterSpacing: "-0.035em",
          textWrap: "balance",
        }}
      >
        Read a query&apos;s{" "}
        <em className="font-mono not-italic font-normal">EXPLAIN</em> like
        prose. <span className="text-muted-foreground">Then fix it.</span>
      </h1>

      {/* Sub */}
      <p className="max-w-[560px] mt-[22px] text-[15px] leading-[1.6] text-muted-foreground">
        QueryLab is a quiet workbench for SQL. Run a statement against your
        read-only role, see the plan tree, the costs, the bottlenecks — and a
        short list of things worth changing.
      </p>

      {/* CTA */}
      <div className="mt-[30px]">
        <Link
          href="/analyze"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors"
        >
          Open Analyzer
          <ArrowRight className="h-[14px] w-[14px]" />
        </Link>
      </div>

      {/* Preview strip */}
      <section className="mt-14 rounded-[var(--radius)] border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-[14px] py-2.5 border-b border-border text-[11px] text-muted-foreground">
          <span
            className="h-1.5 w-1.5 rounded-full bg-border-strong"
            aria-hidden
          />
          <span className="font-mono">EXPLAIN (ANALYZE, FORMAT JSON)</span>
          <span className="ml-auto font-mono">42.18 ms</span>
        </div>
        <div className="p-[18px] grid grid-cols-1 md:grid-cols-2 gap-[18px]">
          {/* SQL preview */}
          <code className="font-mono text-[12.5px] leading-[1.65] text-foreground block whitespace-pre">
            <span className="text-muted-foreground">1 </span>
            <Kw>SELECT</Kw> u.id, u.email,
            {"\n"}
            <span className="text-muted-foreground">2 </span>
            {"  "}count(o.id) <Kw>AS</Kw> orders
            {"\n"}
            <span className="text-muted-foreground">3 </span>
            <Kw>FROM</Kw> users u
            {"\n"}
            <span className="text-muted-foreground">4 </span>
            <Kw>LEFT JOIN</Kw> orders o <Kw>ON</Kw> o.user_id = u.id
            {"\n"}
            <span className="text-muted-foreground">5 </span>
            <Kw>WHERE</Kw> u.created_at &gt; now() - interval{" "}
            <span className="text-[var(--sev-accent)]">&apos;30 days&apos;</span>
            {"\n"}
            <span className="text-muted-foreground">6 </span>
            <Kw>GROUP BY</Kw> u.id;
          </code>
          <MiniPlan />
        </div>
      </section>

      {/* Modules grid — 4 equal cells divided by 1px lines (gap-px trick) */}
      <section
        className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-px rounded-[var(--radius)] border border-border overflow-hidden"
        style={{ background: "var(--border)" }}
      >
        {MODULES.map((m) => (
          <div
            key={m.num}
            className="bg-card px-5 py-[22px] min-h-[148px] flex flex-col"
          >
            <div className="font-mono text-[10.5px] text-muted-foreground tracking-[0.1em]">
              {m.num}
            </div>
            <div className="text-[14px] font-semibold tracking-[-0.005em] mt-2">
              {m.title}
            </div>
            <div className="text-[12.5px] text-muted-foreground leading-[1.5] mt-1.5">
              {m.desc}
            </div>
            <div className="mt-auto pt-[18px] flex items-center gap-1.5 text-[11px]">
              {m.available ? (
                <>
                  <span className="h-[5px] w-[5px] rounded-full bg-[var(--sev-accent)]" />
                  <span className="text-[var(--sev-accent)]">Available</span>
                </>
              ) : (
                <span className="text-muted-foreground">Soon</span>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Footer pellets */}
      <div className="mt-12 flex flex-wrap items-center gap-6 text-[12px] text-muted-foreground">
        <span className="font-mono">postgres 14 / 15 / 16</span>
        <span className="h-[3px] w-[3px] rounded-full bg-border-strong" />
        <span className="font-mono">node · fastify · prisma</span>
        <span className="h-[3px] w-[3px] rounded-full bg-border-strong" />
        <span className="font-mono">readonly role enforced</span>
      </div>
    </div>
  );
}

function Kw({ children }: { children: React.ReactNode }) {
  return <span className="text-foreground/70 dark:text-foreground/75">{children}</span>;
}
