// src/routes/history.ts
// Member 5 — GET /api/v1/queries/history
// Returns paginated query history. Supports filter by type (slow/all/favorites)
// and a configurable limit. Does NOT return full planJson to save bandwidth —
// M4's dashboard only needs summary stats.

import { Router, Request, Response } from "express";
// Try to load generated Prisma client if available; otherwise operate in demo mode.
let prisma: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gen = require("../generated/prisma/client");
  const PrismaClientCtor = gen && gen.PrismaClient ? gen.PrismaClient : gen.PrismaClient;
  if (PrismaClientCtor) prisma = new PrismaClientCtor();
} catch (e) {
  prisma = null;
}

const router = Router();

// In-memory demo store for environments without Prisma
const demoStore = {
  items: [
    {
      id: "1",
      sqlText: "SELECT * FROM users WHERE id = 1",
      executionTimeMs: 12,
      rowCount: 1,
      isFavorite: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      suggestions: [],
      benchmarks: [],
    },
    {
      id: "2",
      sqlText: "SELECT COUNT(*) FROM orders WHERE created_at > now() - interval '1 day'",
      executionTimeMs: 234,
      rowCount: 100,
      isFavorite: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      suggestions: [],
      benchmarks: [],
    },
  ] as Array<Record<string, unknown>>,
  favorites: {} as Record<string, boolean>,
};

// Threshold (ms) above which a query is considered "slow"
const SLOW_QUERY_THRESHOLD_MS = 200;

/**
 * GET /api/v1/queries/history
 *
 * Query params:
 *   type   : "all" | "slow" | "favorites"   (default: "all")
 *   limit  : number 1–200                    (default: 50)
 *   offset : number                          (default: 0)
 *   sort   : "slowest" | "newest" | "fastest" (default: "newest")
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) ?? "all";
    const limit = Math.min(parseInt((req.query.limit as string) ?? "50"), 200);
    const offset = parseInt((req.query.offset as string) ?? "0");
    const sort = (req.query.sort as string) ?? "newest";

    // ── Build where clause ─────────────────────────────────────────────────
    const where: Record<string, unknown> = {};

    if (type === "slow") {
      where.executionTimeMs = { gte: SLOW_QUERY_THRESHOLD_MS };
    } else if (type === "favorites") {
      where.isFavorite = true;
    }

    // ── Build order clause ─────────────────────────────────────────────────
    const orderByMap: Record<string, Record<string, string>> = {
      slowest:  { executionTimeMs: "desc" },
      fastest:  { executionTimeMs: "asc" },
      newest:   { createdAt: "desc" },
    };
    const orderBy = orderByMap[sort] ?? orderByMap.newest;

    // ── Query DB or fallback demo data ──────────────────────────────────────
    if (prisma && prisma.query && typeof prisma.query.findMany === "function") {
      const [queries, total] = await Promise.all([
        prisma.query.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
          select: {
            id:              true,
            sqlText:         true,
            executionTimeMs: true,
            rowCount:        true,
            isFavorite:      true,
            createdAt:       true,
            suggestions: {
              select: { severity: true, category: true, description: true },
            },
            benchmarks: {
              select: { avgTimeMs: true, iterations: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        }),
        prisma.query.count({ where }),
      ]);

      return res.json({
        success: true,
        data: queries,
        meta: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    }

    // Fallback demo data when Prisma models are not available
    const demo = demoStore.items.map((it) => ({
      ...it,
      isFavorite: demoStore.favorites[String(it.id)] ?? Boolean(it.isFavorite),
    }));

    return res.json({
      success: true,
      data: demo,
      meta: { total: demo.length, limit, offset, hasMore: false },
    });
  } catch (err: unknown) {
    console.error("[history] error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch query history.",
    });
  }
});

/**
 * PATCH /api/v1/queries/history/:id/favorite
 * Toggles the isFavorite flag on a historical query.
 * Small utility endpoint — lives here since it's history-domain logic.
 */
router.patch("/:id/favorite", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) {
    return res.status(400).json({ success: false, error: "Invalid query id." });
  }

  try {
    if (!prisma || !prisma.query) {
      // Demo mode: toggle in-memory favorite state and return it
      const idStr = String(id);
      const current = demoStore.favorites[idStr] ?? false;
      demoStore.favorites[idStr] = !current;
      return res.json({ success: true, data: { id, isFavorite: demoStore.favorites[idStr] } });
    }

    const existing = await prisma.query.findUnique({
      where: { id },
      select: { isFavorite: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Query not found." });
    }

    const updated = await prisma.query.update({
      where: { id },
      data: { isFavorite: !existing.isFavorite },
      select: { id: true, isFavorite: true },
    });

    return res.json({ success: true, data: updated });
  } catch (err: unknown) {
    console.error("[history/favorite] error:", err);
    return res.status(500).json({ success: false, error: "Failed to toggle favorite." });
  }
});

export default router;
