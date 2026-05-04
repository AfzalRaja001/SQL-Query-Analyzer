"use client";

import { useState } from "react";
import {
  BarChart as ReBarChart, Bar,
  LineChart as ReLineChart, Line, ReferenceLine,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import AppShell from "./AppShell";

interface BenchmarkResult {
  iterations: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  p95TimeMs: number;
  history: number[];
}

function fmt(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

const tickStyle = { fill: "#444", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" };

/* ── Bar chart component ─────────────────────────────────────── */
function BarChart({ history, avg }: { history: number[]; avg: number }) {
  const data = history.map((ms, i) => ({ run: i + 1, ms }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ReBarChart data={data} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke="#1e1e1e" />
        <XAxis dataKey="run" tick={tickStyle} axisLine={false} tickLine={false} />
        <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}ms`} width={45} />
        <Tooltip
          contentStyle={{ background: "#1c1c1c", border: "1px solid #2a2a2a", borderRadius: 6, fontSize: 11 }}
          labelStyle={{ color: "#555" }}
          itemStyle={{ color: "#22d3ee" }}
          formatter={(v) => [`${fmt(v as number)} ms`, "time"]}
          labelFormatter={(l) => `Run #${l}`}
        />
        <ReferenceLine y={avg} stroke="#818cf8" strokeDasharray="4 4" strokeWidth={1.5} />
        <Bar dataKey="ms" fill="#22d3ee" radius={[3, 3, 0, 0]} />
      </ReBarChart>
    </ResponsiveContainer>
  );
}

/* ── Line chart component ────────────────────────────────────── */
function LineChart({ history, avg }: { history: number[]; avg: number }) {
  const data = history.map((ms, i) => ({ run: i + 1, ms }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ReLineChart data={data}>
        <CartesianGrid stroke="#1e1e1e" />
        <XAxis dataKey="run" tick={tickStyle} axisLine={false} tickLine={false} />
        <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}ms`} width={45} />
        <Tooltip
          contentStyle={{ background: "#1c1c1c", border: "1px solid #2a2a2a", borderRadius: 6, fontSize: 11 }}
          labelStyle={{ color: "#555" }}
          itemStyle={{ color: "#818cf8" }}
          formatter={(v) => [`${fmt(v as number)} ms`, "time"]}
          labelFormatter={(l) => `Run #${l}`}
        />
        <ReferenceLine y={avg} stroke="#818cf8" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "avg", fill: "#818cf8", fontSize: 10 }} />
        <Line type="monotone" dataKey="ms" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: "#818cf8" }} activeDot={{ r: 5 }} />
      </ReLineChart>
    </ResponsiveContainer>
  );
}

/* ── Stat card ───────────────────────────────────────────────── */
function StatCard({ label, value, color, borderColor }: { label: string; value: string; color: string; borderColor: string }) {
  return (
    <div style={{ background: "#161616", border: `1px solid ${borderColor}`, borderRadius: 8, padding: "14px 16px", flex: "1 1 140px", minWidth: 0 }}>
      <div style={{ fontSize: 9, letterSpacing: ".13em", textTransform: "uppercase" as const, color: "#444", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color }}>
        {value} <span style={{ fontSize: 12, fontWeight: 400, color: "#444" }}>ms</span>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function BenchmarkClient() {
  const [sql, setSql] = useState("SELECT COUNT(*) FROM orders WHERE status = 'active';");
  const [iterations, setIterations] = useState(20);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!sql.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql, iterations }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Benchmark failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const card: React.CSSProperties = {
    background: "#161616",
    border: "1px solid #242424",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  };

  return (
    <AppShell title="Benchmark">
      {/* ── Editor card ── */}
      <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: 8, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderBottom: "1px solid #1e1e1e" }}>
          <div style={{ width: 7, height: 7, background: "#2e2e2e", borderRadius: "50%" }} />
          <span style={{ fontSize: 10, letterSpacing: ".1em", color: "#444" }}>EXPLAIN (ANALYZE, FORMAT JSON)</span>
        </div>

        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          rows={3}
          spellCheck={false}
          style={{
            width: "100%", background: "transparent", border: "none", outline: "none",
            resize: "none", fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
            lineHeight: 1.75, color: "#e2e2e2", padding: "14px 16px", caretColor: "#e2e2e2",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px 13px", borderTop: "1px solid #1e1e1e" }}>
          <span style={{ fontSize: 11, color: "#444", minWidth: 60 }}>Iterations</span>
          <input
            type="range" min={1} max={50} step={1} value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            style={{ flex: 1, accentColor: "#e2e2e2", cursor: "pointer" }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e2e2", minWidth: 22, textAlign: "right" }}>{iterations}</span>
          <button
            onClick={run}
            disabled={loading || !sql.trim()}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: loading ? "#1c1c1c" : "#e2e2e2",
              color: loading ? "#444" : "#111",
              border: "none", borderRadius: 6, padding: "7px 18px",
              fontSize: 12, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Running..." : "⚡ Run"}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background: "#190c0c", border: "1px solid #3b1515", borderRadius: 6, padding: "10px 14px", fontSize: 12, color: "#f87171", marginBottom: 14 }}>
          {error}
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <>
          {/* Stat row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <StatCard label="Avg Time" value={fmt(result.avgTimeMs)} color="#818cf8" borderColor="#292950" />
            <StatCard label="Min Time" value={fmt(result.minTimeMs)} color="#4ade80" borderColor="#163825" />
            <StatCard label="Max Time" value={fmt(result.maxTimeMs)} color="#f87171" borderColor="#381616" />
            <StatCard label="P95 Time" value={fmt(result.p95TimeMs)} color="#fb923c" borderColor="#382510" />
          </div>

          {/* Bar chart */}
          <div style={{ ...card, padding: "20px 20px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#888", textAlign: "center", marginBottom: 16 }}>Per-Iteration Execution Time</div>
            <BarChart history={result.history} avg={result.avgTimeMs} />
          </div>

          {/* Line chart */}
          <div style={{ ...card, padding: "20px 20px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#888", textAlign: "center", marginBottom: 10 }}>Trend Line with Average Baseline</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 10 }}>
              {[{ dash: true, label: "avg" }, { dash: false, label: "time" }].map(({ dash, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#444" }}>
                  <svg width="22" height="10" aria-hidden="true">
                    <line x1="0" y1="5" x2="22" y2="5" stroke="#818cf8" strokeWidth="1.5" strokeDasharray={dash ? "4 3" : undefined} />
                    {!dash && <circle cx="11" cy="5" r="3" fill="#818cf8" />}
                  </svg>
                  {label}
                </div>
              ))}
            </div>
            <LineChart history={result.history} avg={result.avgTimeMs} />
          </div>
        </>
      )}

      {/* ── Empty state ── */}
      {!result && !loading && !error && (
        <div style={{ textAlign: "center", padding: "60px 0", fontSize: 12, color: "#444" }}>
          Configure your query above and hit <span style={{ color: "#888" }}>⚡ Run</span> to start benchmarking.
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}
