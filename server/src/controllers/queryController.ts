import { Request, Response } from "express";
import { performance } from "perf_hooks";
import { getTargetClient } from "../db/targetDb";
import { validateQuery } from "../services/queryValidator";
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

export async function executeQuery(
  req: Request,
  res: Response
): Promise<void> {
  const { query, analyze } = req.body;

  const validation = validateQuery(query);
  if (!validation.isValid) {
    res.status(400).json({
      success: false,
      error: validation.error,
    });
    return;
  }

  let client;

  try {
    client = await getTargetClient();

    const startTime = performance.now();
    const result = await client.query(query);
    const endTime = performance.now();

    const executionTimeMs = parseFloat((endTime - startTime).toFixed(3));

    let executionPlan = null;

    if (analyze) {
      const explainQuery = `EXPLAIN (ANALYZE, FORMAT JSON) ${query}`;
      const explainResult = await client.query(explainQuery);

      if (
        explainResult.rows.length > 0 &&
        explainResult.rows[0]["QUERY PLAN"]
      ) {
        executionPlan = explainResult.rows[0]["QUERY PLAN"][0].Plan;
      }
    }

    /* ================= SUGGESTIONS ================= */

    let suggestions = analyze ? analyzeSQL(query) : [];

    const columnNames = result.fields.map((f: any) => f.name);

    // 🔥 SELECT * rewrite suggestion
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

    // 🔥 LIMIT suggestion (only if large result)
    if (!/limit\s+\d+/i.test(query) && result.rowCount > 50) {
      const limited = addLimitIfMissing(query);

      suggestions.push({
        sev: "info",
        title: "Add LIMIT",
        body: "Adding LIMIT prevents large result scans.",
        category: "Optimization",
        sql: limited,
      });
    }

    // 🔥 Seq Scan detection
    if (analyze && executionPlan) {
      const seqScans = findSeqScans(executionPlan);

      seqScans.forEach((node) => {
        const table = node["Relation Name"];
        const filter = node["Filter"];

        // skip system tables
        if (
          !table ||
          table.startsWith("pg_") ||
          table.includes("information_schema")
        ) {
          return;
        }

        if (!filter) return;

        const column = extractColumnFromFilter(filter);
        if (!column) return;

        const indexSQL = `CREATE INDEX idx_${table}_${column} ON ${table}(${column});`;

        suggestions.push({
          sev: "warning",
          title: "Sequential Scan detected",
          body: `Table "${table}" is fully scanned due to filter on "${column}". Consider adding an index.`,
          category: "Performance",
          sql: indexSQL,
        });
      });
    }

    /* ================= FINAL OPTIMIZED QUERY ================= */

    let optimizedQuery = query;

    if (/\bselect\s+\*/i.test(optimizedQuery) && columnNames.length > 0) {
      optimizedQuery = rewriteSelectStar(optimizedQuery, columnNames);
    }

    optimizedQuery = addLimitIfMissing(optimizedQuery);

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
      data: result.rows,
      rowCount: result.rowCount,
      executionTimeMs,
      fields: result.fields.map(
        (f: { name: string; dataTypeID: number }) => ({
          name: f.name,
          dataType: f.dataTypeID,
        })
      ),
      executionPlan,
      suggestions,
    });
  } catch (error: unknown) {
    const pgError = error as { code?: string; message?: string };

    if (pgError.code === "57014") {
      res.status(408).json({
        success: false,
        error: "Query timed out. The 10-second execution limit was exceeded.",
      });
      return;
    }

    if (pgError.code === "42501") {
      res.status(403).json({
        success: false,
        error: "Permission denied. Only SELECT queries are allowed.",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error:
        pgError.message ||
        "An unexpected error occurred during query execution.",
    });
  } finally {
    if (client) {
      await client.end();
    }
  }
}