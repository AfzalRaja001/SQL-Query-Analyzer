import { NextRequest, NextResponse } from "next/server";
import { getOrCreatePool } from "@/lib/db/readonlyClient";

export async function GET() {
    try {
        const pool = getOrCreatePool("history-pool", {
            connectionString: process.env.DATABASE_URL,
        });

        // 1. Get the raw data from Postgres
        const result = await pool.query(
            "SELECT * FROM history ORDER BY created_at DESC LIMIT 50"
        );

        // 2. Map snake_case to camelCase
        const data = result.rows.map((row) => ({
            id: row.id,
            sqlText: row.sql_text,             // CRITICAL: UI looks for 'sqlText'
            executionTimeMs: Number(row.execution_time_ms), // UI looks for 'executionTimeMs'
            rowCount: Number(row.row_count),
            isFavorite: row.is_favorite,
            suggestions: row.suggestions || [],
            createdAt: row.created_at,
        }));

        return NextResponse.json({
            data,
            meta: { hasMore: false },
        });
    } catch (error: any) {
        console.error("History Fetch Error:", error.message);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}