"use client";

import { useState, useRef, useEffect } from "react";
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

/* ── tiny Chart.js hook ───────────────────────────────────────── */
function useChartJs() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if ((window as any).Chart) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  return ready;
}

/* ── Bar chart component ─────────────────────────────────────── */
function BarChart({ history, avg }: { history: number[]; avg: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  const chartReady = useChartJs();

  useEffect(() => {
    if (!chartReady || !ref.current) return;
    const Chart = (window as any).Chart;
    if (chartRef.current) chartRef.current.destroy();

    const labels = history.map((_, i) => i + 1);
    const tickFont = { family: "'JetBrains Mono', monospace", size: 10 };
    const gridColor = "#1e1e1e";
    const tickColor = "#444";

    chartRef.current = new Chart(ref.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data: history,
          backgroundColor: "#22d3ee",
          borderRadius: 3,
          borderSkipped: "bottom",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1c1c1c",
            borderColor: "#2a2a2a",
            borderWidth: 1,
            titleColor: "#555",
            bodyColor: "#22d3ee",
            titleFont: tickFont,
            bodyFont: tickFont,
            callbacks: {
              title: (items: any[]) => `Run #${items[0].label}`,
              label: (item: any) => `${fmt(item.raw)} ms`,
            },
          },
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: tickColor, font: tickFont, maxTicksLimit: 20 }, border: { display: false } },
          y: { grid: { color: gridColor }, ticks: { color: tickColor, font: tickFont, callback: (v: any) => `${v}ms` }, border: { display: false } },
        },
      },
      plugins: [{
        id: "refLine",
        afterDraw(chart: any) {
          const { ctx, scales: { y }, chartArea } = chart;
          const yPx = y.getPixelForValue(avg);
          ctx.save();
          ctx.strokeStyle = "#818cf8";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(chartArea.left, yPx);
          ctx.lineTo(chartArea.right, yPx);
          ctx.stroke();
          ctx.restore();
        },
      }],
    });
    return () => { chartRef.current?.destroy(); };
  }, [chartReady, history, avg]);

  return (
    <div style={{ position: "relative", width: "100%", height: 200 }}>
      <canvas ref={ref} role="img" aria-label="Bar chart of per-iteration execution time" />
    </div>
  );
}

/* ── Line chart component ────────────────────────────────────── */
function LineChart({ history, avg }: { history: number[]; avg: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  const chartReady = useChartJs();

  useEffect(() => {
    if (!chartReady || !ref.current) return;
    const Chart = (window as any).Chart;
    if (chartRef.current) chartRef.current.destroy();

    const labels = history.map((_, i) => i + 1);
    const tickFont = { family: "'JetBrains Mono', monospace", size: 10 };

    chartRef.current = new Chart(ref.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "avg",
            data: history.map(() => avg),
            borderColor: "#818cf8",
            borderWidth: 1.5,
            borderDash: [4, 3],
            pointRadius: 0,
            tension: 0,
          },
          {
            label: "time",
            data: history,
            borderColor: "#818cf8",
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: "#818cf8",
            pointHoverRadius: 5,
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1c1c1c",
            borderColor: "#2a2a2a",
            borderWidth: 1,
            titleColor: "#555",
            titleFont: tickFont,
            bodyFont: tickFont,
            callbacks: {
              title: (items: any[]) => `Run #${items[0].label}`,
              label: (item: any) => `${item.dataset.label}: ${fmt(item.raw)} ms`,
            },
          },
        },
        scales: {
          x: { grid: { color: "#1e1e1e" }, ticks: { color: "#444", font: tickFont, maxTicksLimit: 20 }, border: { display: false } },
          y: { grid: { color: "#1e1e1e" }, ticks: { color: "#444", font: tickFont, callback: (v: any) => `${v}ms` }, border: { display: false } },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [chartReady, history, avg]);

  return (
    <div style={{ position: "relative", width: "100%", height: 200 }}>
      <canvas ref={ref} role="img" aria-label="Line chart of execution time trend with average baseline" />
    </div>
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
