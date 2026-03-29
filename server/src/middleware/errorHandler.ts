import { Request, Response, NextFunction } from "express";

/**
 * Centralized error-handling middleware.
 * Express recognizes this as an error handler because it has 4 parameters.
 * Any error thrown or passed via next(err) in any route will land here.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("Server Error:", err.message);
  console.error(err.stack);

  res.status(500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
};
