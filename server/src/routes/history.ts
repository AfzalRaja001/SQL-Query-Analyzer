import { Router } from "express";
import { Pool } from "pg";

const historyDbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const router = Router();

// GET /api/v1/history
router.get("/", async (req, res) => {
  try {
    const { type, sort } = req.query;

    // 1. Start with base SQL
    let queryText = `
      SELECT id, 
             sql_text as "sqlText", 
             execution_time_ms as "executionTimeMs", 
             row_count as "rowCount", 
             is_favorite as "isFavorite", 
             created_at as "createdAt"
      FROM history
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    // 2. Apply Filters (Slow vs Favorites)
    if (type === "slow") {
      conditions.push("execution_time_ms > 200");
    } else if (type === "favorites") {
      conditions.push("is_favorite = true");
    }

    if (conditions.length > 0) {
      queryText += " WHERE " + conditions.join(" AND ");
    }

    // 3. Apply Sorting
    if (sort === "slowest") {
      queryText += " ORDER BY execution_time_ms DESC";
    } else if (sort === "fastest") {
      queryText += " ORDER BY execution_time_ms ASC";
    } else {
      queryText += " ORDER BY created_at DESC";
    }

    const result = await historyDbPool.query(queryText, params);

    res.json({
      success: true,
      data: result.rows,
      meta: {
        total: result.rowCount,
        hasMore: false // Simplified for now
      }
    });
  } catch (err: any) {
    console.error("History fetch error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/v1/history/:id/favorite
router.patch("/:id/favorite", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await historyDbPool.query(
      `UPDATE history 
       SET is_favorite = NOT COALESCE(is_favorite, false) 
       WHERE id = $1 
       RETURNING id, is_favorite as "isFavorite"`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Query not found" });
    }

    // The frontend expects the object inside a 'data' property
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err: any) {
    console.error("PATCH error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;