import { Request, Response } from "express";
import { performance } from "perf_hooks";
import type { PoolClient } from "pg";
import { getTargetClient } from "../db/targetDb";
import { validateQuery } from "../services/queryValidator";
import { withSafeClient } from "../services/safeRun";
import { dbFindConnection, dbTouchConnection } from "../db/adminDb";
import { decrypt } from "../services/encryption";
import { getOrCreatePool } from "../services/connectionPool";
import { analyzeSQL } from "../services/sqlAnalyzer";

/* ================= HELPERS ================= */

function findSeqScans(plan: any, results: any[] = []) {
  if (!plan) return results;

  if (plan["Node Type"] === "Seq Scan") {
    results.push(plan);
  }

  if (plan.Plans) {
    for (const child of plan.Plans) {
      findSeqScans(child, results);
    }
  }

  return results;
}

function extractColumnFromFilter(filter: string): string | null {
  const match = filter.match(/([a-zA-Z0-9_]+)\s*=\s*/);
  if (!match || !match[1]) return null;
  return match[1];
}

function rewriteSelectStar(query: string, columns: string[]): string {
  const rewritten = query.replace(
    /\bselect\s+\*/i,
    `SELECT ${columns.join(", ")}`
  );
  return rewritten.trim().replace(/;?$/, ";");
}

function addLimitIfMissing(query: string, limit = 100): string {
  if (/limit\s+\d+/i.test(query)) return query;
  return query.trim().replace(/;?$/, ` LIMIT ${limit};`);
}

/* ================= CONTROLLER ================= */

/** POST /api/v1/queries/execute */
export async function executeQuery(req: Request, res: Response): Promise<void> {
  const { query, analyze, connectionId } = req.body;

  const validation = validateQuery(query);
  if (!validation.isValid) {
    res.status(400).json({ success: false, error: validation.error });
    return;
  }

  // client is either a pg.Client (default path) or pg.PoolClient (BYO-DB path)
  let cleanup: (() => Promise<void>) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let client: any = null;

  try {
    if (connectionId) {
      const conn = await dbFindConnection(connectionId);
      if (!conn) {
        res.status(404).json({ success: false, error: "Connection not found." });
        return;
      }

      const password = decrypt(conn.secretEnc);
      const pool = getOrCreatePool(connectionId, {
        host: conn.host,
        port: conn.port,
        database: conn.database,
        user: conn.username,
        password,
        ssl: conn.sslMode === "disable" ? false : { rejectUnauthorized: false },
        max: 5,
      });
      const poolClient: PoolClient = await pool.connect();
      client = poolClient;
      cleanup = async () => { poolClient.release(); };
    } else {
      const targetClient = await getTargetClient();
      client = targetClient;
      cleanup = async () => { await targetClient.end().catch(() => {}); };
    }

    const { rows, rowCount, fields, executionPlan, executionTimeMs } =
      await withSafeClient(client, async (q) => {
        const start = performance.now();
        const result = await q(query);
        const executionTimeMs = parseFloat((performance.now() - start).toFixed(3));

        let executionPlan = null;
        if (analyze) {
          const explainResult = await q(`EXPLAIN (ANALYZE, FORMAT JSON) ${query}`);
          if (explainResult.rows.length > 0 && explainResult.rows[0]["QUERY PLAN"]) {
            executionPlan = explainResult.rows[0]["QUERY PLAN"][0].Plan;
          }
        }

        return {
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields,
          executionPlan,
          executionTimeMs,
        };
      });

    if (connectionId) {
      dbTouchConnection(connectionId).catch(() => {});
    }

    /* ================= SUGGESTIONS ================= */

    let suggestions = analyze ? analyzeSQL(query) : [];

    const columnNames = fields.map((f: any) => f.name);

    // SELECT * rewrite suggestion
    if (/\bselect\s+\*/i.test(query) && columnNames.length > 0) {
      const rewritten = rewriteSelectStar(query, columnNames);
      suggestions.push({
        sev: "warning",
        title: "Rewrite SELECT *",
        body: "Replaced '*' with actual column names to reduce I/O.",
        category: "Optimization",
        sql: rewritten,
      });
    }

    // LIMIT suggestion (only for large SELECT results)
    if (/^\s*select\b/i.test(query) && !/limit\s+\d+/i.test(query) && rows.length > 50) {
      const limited = addLimitIfMissing(query);
      suggestions.push({
        sev: "info",
        title: "Add LIMIT",
        body: "Adding LIMIT prevents large result scans.",
        category: "Optimization",
        sql: limited,
      });
    }

    // Seq Scan detection
    if (analyze && executionPlan) {
      const seqScans = findSeqScans(executionPlan);

      seqScans.forEach((node) => {
        const table = node["Relation Name"];
        const filter = node["Filter"];

        if (!table || table.startsWith("pg_") || table.includes("information_schema")) {
          return;
        }
        if (!filter) return;

        const column = extractColumnFromFilter(filter);
        if (!column) return;

        suggestions.push({
          sev: "warning",
          title: "Sequential Scan detected",
          body: `Table "${table}" is fully scanned due to filter on "${column}". Consider: CREATE INDEX idx_${table}_${column} ON ${table}(${column});`,
          category: "Performance",
        });
      });
    }

    /* ================= FINAL OPTIMIZED QUERY ================= */

    let optimizedQuery = query;

    if (/\bselect\s+\*/i.test(optimizedQuery) && columnNames.length > 0) {
      optimizedQuery = rewriteSelectStar(optimizedQuery, columnNames);
    }

    if (/^\s*select\b/i.test(optimizedQuery)) {
      optimizedQuery = addLimitIfMissing(optimizedQuery);
    }

    if (optimizedQuery !== query) {
      suggestions.push({
        sev: "warning",
        title: "Optimized Query",
        body: "Combined improvements: removed SELECT * and added LIMIT.",
        category: "Final",
        sql: optimizedQuery,
      });
    }

    /* ================= RESPONSE ================= */

    res.json({
      success: true,
      data: rows,
      rowCount,
      executionTimeMs,
      fields: fields.map((f: { name: string; dataTypeID: number }) => ({
        name: f.name,
        dataType: f.dataTypeID,
      })),
      executionPlan,
      suggestions,
    });
  } catch (error: unknown) {
    const pgError = error as { code?: string; message?: string };

    if (pgError.code === "57014") {
      res.status(408).json({ success: false, error: "Query timed out. The 10-second execution limit was exceeded." });
      return;
    }
    if (pgError.code === "42501") {
      res.status(403).json({ success: false, error: "Permission denied. Only SELECT queries are allowed." });
      return;
    }
    if (pgError.code === "25006") {
      res.status(403).json({ success: false, error: "Write operations are not allowed inside a read-only transaction." });
      return;
    }

    res.status(500).json({
      success: false,
      error:
        pgError.message ||
        "An unexpected error occurred during query execution.",
    });
  } finally {
    if (cleanup) await cleanup();
  }
}
