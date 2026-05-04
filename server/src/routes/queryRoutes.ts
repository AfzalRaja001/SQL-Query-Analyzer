import { Router, Request, Response } from "express";
import { executeQuery } from "../controllers/queryController";
import compareRouter from "./compare";
import historyRouter from "./history";

const router = Router();

/**
 * GET /api/v1/queries/health
 * A simple health-check endpoint to verify the query router is mounted correctly.
 */
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Query API is running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/v1/queries/execute
 * Executes a SQL query safely against the target database.
 */
router.post("/execute", executeQuery);

/**
 * POST /api/v1/queries/benchmark
 * Placeholder 
 */
router.post("/benchmark", (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Benchmark endpoint not yet implemented.",
  });
});

/**
 * Mount compare routes
 */
router.use("/compare", compareRouter);

/**
 * Mount history routes
 */
router.use("/history", historyRouter);

export default router;
