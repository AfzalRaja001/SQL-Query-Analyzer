import { NextRequest, NextResponse } from "next/server";
import { benchmarkQuery } from "@/lib/services/benchmarkService";

/**
 * Next.js Route Handler for POST /api/benchmark
 * Replaces the Express router.post("/") logic.
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Get data from the request body
        const { query, iterations } = await req.json();

        // 2. Validation (Same as your Express logic)
        if (!query || typeof query !== "string") {
            return NextResponse.json(
                { success: false, error: "query is required" },
                { status: 400 }
            );
        }

        // 3. Logic (Clamp iterations between 1 and 50)
        const iters = Math.min(Math.max(Number(iterations) || 10, 1), 50);

        // 4. Call your service
        const result = await benchmarkQuery(query, iters);

        // 5. Return success response
        return NextResponse.json({ success: true, ...result });

    } catch (err: any) {
        console.error("[benchmark] error:", err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}