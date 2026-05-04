// src/routes/compare.ts
// Member 5 — POST /api/v1/queries/compare
// Runs two queries in parallel through the same safety layer M1 built,
// then computes cost diff and declares a winner.
// Depends on: M1's execute + plan-fetch logic (imported as executeQuery helper)
//             M2's parseNode + optimization engine (imported for both sides)

import { Router, Request, Response } from "express";
import { Client } from "pg";
import { performance } from "perf_hooks";

const router = Router();
// Try to construct generated Prisma client if available; otherwise fall back to null.
let prisma: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gen = require("../generated/prisma/client");
  const PrismaClientCtor = gen && gen.PrismaClient ? gen.PrismaClient : gen.PrismaClient;
  if (PrismaClientCtor) prisma = new PrismaClientCtor();
} catch (e) {
  prisma = null;
}

// Try to load optional suggestionService; fall back to no-op if missing
let persistSuggestions: (queryId: number, suggestions: any[]) => Promise<void> = async () => {};
type RawSuggestion = { severity?: string; category?: string; description?: string };
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const svc = require("../services/suggestionService");
  if (svc && typeof svc.persistSuggestions === "function") {
    persistSuggestions = svc.persistSuggestions;
  }
} catch (e) {
  // missing optional service; keep no-op
}

// ── Inline safety check (mirrors M1's blacklist; keep in sync) ─────────────
const BLACKLISTED = /\b(DROP|DELETE|TRUNCATE|ALTER|INSERT|UPDATE|CREATE|GRANT|REVOKE)\b/i;

function isSafe(sql: string): boolean {
  return !BLACKLISTED.test(sql);
}

// ── Single-query execution helper (runs EXPLAIN ANALYZE, returns parsed data) ─
// NOTE: M2 will export parseNode and runOptimizationEngine from their files.
// For now we keep a minimal inline version so this file is self-contained:
async function runSingleQuery(sql: string) {
  const client = new Client({ connectionString: process.env.TARGET_DB_URL });
  await client.connect();

  try {
    await client.query("SET statement_timeout = '10s';");

    const start = performance.now();
    const explainResult = await client.query(`EXPLAIN (ANALYZE, FORMAT JSON) ${sql}`);
    const executionTimeMs = parseFloat((performance.now() - start).toFixed(3));

    const rawPlan = explainResult.rows[0]["QUERY PLAN"][0].Plan;

    const parsedPlan = minimalParseNode(rawPlan);
    const totalCost: number = parsedPlan.totalCost;

    return { parsedPlan, totalCost, executionTimeMs };
  } finally {
    await client.end();
  }
}

// Minimal stand-in for M2's parseNode — replace with M2's import when merged
function minimalParseNode(node: Record<string, unknown>): {
  nodeType: string;
  totalCost: number;
  estimatedRows: number;
  actualTimeMs: number;
  children: ReturnType<typeof minimalParseNode>[];
} {
  return {
    nodeType:     (node["Node Type"] as string) ?? "Unknown",
    totalCost:    (node["Total Cost"] as number) ?? 0,
    estimatedRows:(node["Plan Rows"] as number)  ?? 0,
    actualTimeMs: (node["Actual Total Time"] as number) ?? 0,
    children: ((node["Plans"] as Record<string, unknown>[]) ?? []).map(
      minimalParseNode
    ),
  };
}

/**
 * POST /api/v1/queries/compare
 *
 * Body: { queryA: string, queryB: string }
 *
 * Runs both queries in parallel (Promise.all), then:
 *  - Computes percentage cost difference
 *  - Declares a winner (lower totalCost wins)
 *  - Persists both queries + their suggestions to the metadata DB
 *  - Returns full parsed plans for both so M4's UI can render side-by-side trees
 */
router.post("/", async (req: Request, res: Response) => {
  const { queryA, queryB } = req.body;

  if (!queryA || !queryB || typeof queryA !== "string" || typeof queryB !== "string") {
    return res.status(400).json({
      success: false,
      error: "Both queryA and queryB are required strings.",
    });
  }

  if (!isSafe(queryA) || !isSafe(queryB)) {
    return res.status(403).json({
      success: false,
      error: "One or both queries contain disallowed statements (DDL/DML).",
    });
  }

  try {
    const [resultA, resultB] = await Promise.all([
      runSingleQuery(queryA),
      runSingleQuery(queryB),
    ]);

    const costA = resultA.totalCost;
    const costB = resultB.totalCost;

    const diffPercentage =
      costA + costB === 0
        ? 0
        : parseFloat(
            (Math.abs(costA - costB) / ((costA + costB) / 2) * 100).toFixed(2)
          );

    const winner: "queryA" | "queryB" | "tie" =
      costA < costB ? "queryA" : costB < costA ? "queryB" : "tie";

    let savedA: any;
    let savedB: any;
    if (prisma && prisma.query && typeof prisma.query.create === "function") {
      [savedA, savedB] = await Promise.all([
        prisma.query.create({
          data: {
            sqlText:         queryA,
            executionTimeMs: resultA.executionTimeMs,
            rowCount:        resultA.parsedPlan.estimatedRows,
            planJson:        resultA.parsedPlan as object,
          },
        }),
        prisma.query.create({
          data: {
            sqlText:         queryB,
            executionTimeMs: resultB.executionTimeMs,
            rowCount:        resultB.parsedPlan.estimatedRows,
            planJson:        resultB.parsedPlan as object,
          },
        }),
      ]);
    } else {
      // Fallback: create lightweight in-memory stub objects so response shape stays consistent.
      savedA = { id: Date.now() + 1 };
      savedB = { id: Date.now() + 2 };
    }

    const suggestionsA: RawSuggestion[] = [];
    const suggestionsB: RawSuggestion[] = [];

    await Promise.all([
      persistSuggestions(savedA.id, suggestionsA),
      persistSuggestions(savedB.id, suggestionsB),
    ]);

    return res.json({
      success: true,
      winner,
      diffPercentage,
      resultsA: {
        queryId:        savedA.id,
        executionTimeMs: resultA.executionTimeMs,
        totalCost:      costA,
        plan:           resultA.parsedPlan,
        suggestions:    suggestionsA,
      },
      resultsB: {
        queryId:        savedB.id,
        executionTimeMs: resultB.executionTimeMs,
        totalCost:      costB,
        plan:           resultB.parsedPlan,
        suggestions:    suggestionsB,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown execution error.";
    console.error("[compare] error:", message);
    return res.status(500).json({ success: false, error: message });
  }
});

export default router;
