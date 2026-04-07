import { Request, Response } from "express";
import { performance } from "perf_hooks";
import { getTargetClient } from "../db/targetDb";
import { validateQuery } from "../services/queryValidator";

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
    // Step 2: Connect to the target database (readonly_user + 10s timeout)
    client = await getTargetClient();

    // Step 3: Execute the query with precise timing
    const startTime = performance.now();
    const result = await client.query(query);
    const endTime = performance.now();

    const executionTimeMs = parseFloat((endTime - startTime).toFixed(3));

    // Step 4: Optionally execute EXPLAIN if analyze is true
    let executionPlan = null;
    if (analyze) {
      const explainQuery = `EXPLAIN (ANALYZE, FORMAT JSON) ${query}`;
      const explainResult = await client.query(explainQuery);
      if (explainResult.rows.length > 0 && explainResult.rows[0]["QUERY PLAN"]) {
        executionPlan = explainResult.rows[0]["QUERY PLAN"][0].Plan;
      }
    }

    // Step 5: Return structured response with data and metrics
    res.json({
      success: true,
      data: result.rows,
      rowCount: result.rowCount,
      executionTimeMs,
      fields: result.fields.map((f: { name: string; dataTypeID: number }) => ({
        name: f.name,
        dataType: f.dataTypeID,
      })),
      executionPlan,
    });
  } catch (error: unknown) {
    // Handle specific PostgreSQL errors 
    const pgError = error as { code?: string; message?: string };

    // Timeout error 
    if (pgError.code === "57014") {
      res.status(408).json({
        success: false,
        error: "Query timed out. The 10-second execution limit was exceeded.",
      });
      return;
    }

    // Permission denied (readonly_user tried something forbidden)
    if (pgError.code === "42501") {
      res.status(403).json({
        success: false,
        error: "Permission denied. Only SELECT queries are allowed.",
      });
      return;
    }

    // Any other SQL or connection error
    res.status(500).json({
      success: false,
      error: pgError.message || "An unexpected error occurred during query execution.",
    });
  } finally {
    // Step 6: Always disconnect the client to free the connection
    if (client) {
      await client.end();
    }
  }
}
