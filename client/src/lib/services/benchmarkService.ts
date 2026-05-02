import { getReadonlyClient } from "../db/readonlyClient";

export interface BenchmarkResult {
  benchmarkId: null; // set after DB write in full impl
  iterations: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  p95TimeMs: number;
  history: number[]; // per-iteration ms
}

/**
 * Runs `sql` exactly `iterations` times against the read-only PostgreSQL role,
 * collecting wall-clock time for each run. Network round-trip is included but
 * kept consistent since all runs go through the same connection.
 *
 * Safety rules:
 *  - Queries are wrapped in a read-only transaction to prevent side-effects.
 *  - A statement_timeout of 10 s is set per run.
 *  - Only SELECT / EXPLAIN statements pass the allowlist regex.
 */
export async function benchmarkQuery(
  sql: string,
  iterations: number
): Promise<BenchmarkResult> {
  validateSql(sql);

  const client = await getReadonlyClient();
  const history: number[] = [];

  try {
    for (let i = 0; i < iterations; i++) {
      await client.query("SET statement_timeout = '10s';");
      await client.query("BEGIN READ ONLY;");

      const start = performance.now();
      await client.query(sql);
      const elapsed = performance.now() - start;

      await client.query("ROLLBACK;");
      history.push(parseFloat(elapsed.toFixed(2)));
    }
  } finally {
    client.release();
  }

  const sorted = [...history].sort((a, b) => a - b);
  const avg = history.reduce((s, v) => s + v, 0) / history.length;
  const p95Index = Math.ceil(0.95 * sorted.length) - 1;

  return {
    benchmarkId: null,
    iterations,
    avgTimeMs: parseFloat(avg.toFixed(2)),
    minTimeMs: sorted[0],
    maxTimeMs: sorted[sorted.length - 1],
    p95TimeMs: sorted[p95Index],
    history,
  };
}

/** Minimal SQL allowlist — only SELECT / EXPLAIN / WITH (CTEs) */
function validateSql(sql: string) {
  const trimmed = sql.trim().toUpperCase();
  const allowed = /^(SELECT|EXPLAIN|WITH)\b/;
  if (!allowed.test(trimmed)) {
    throw new Error(
      "Only SELECT, EXPLAIN, and WITH (CTE) statements are permitted in benchmark mode."
    );
  }
}
