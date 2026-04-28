import { Request, Response } from "express";
import { performance } from "perf_hooks";
import { getTargetClient } from "../db/targetDb";
import { validateQuery } from "../services/queryValidator";
import { analyzeSQL } from "../services/sqlAnalyzer";

/**
 * POST /api/v1/queries/execute
 */
export async function executeQuery(req: Request, res: Response): Promise<void> {
  // Step 1: Extract and validate the query
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
    // Step 2: Connect to the target database
    client = await getTargetClient();

    // Step 3: Execute the query with timing
    const startTime = performance.now();
    const result = await client.query(query);
    const endTime = performance.now();

    const executionTimeMs = parseFloat((endTime - startTime).toFixed(3));

    // Step 4: Execution plan (if analyze = true)
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

    // 🔥 Step 5: Generate suggestions (THIS IS NEW)
    const suggestions = analyze ? analyzeSQL(query) : [];

    // Step 6: Return response
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