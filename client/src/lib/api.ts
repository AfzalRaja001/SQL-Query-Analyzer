import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export interface PlanNode {
  "Node Type"?: string;
  "Total Cost"?: number;
  "Startup Cost"?: number;
  "Plan Rows"?: number;
  "Actual Total Time"?: number;
  "Actual Rows"?: number;
  "Actual Loops"?: number;
  "Relation Name"?: string;
  "Index Name"?: string;
  "Filter"?: string;
  "Index Cond"?: string;
  Plans?: PlanNode[];
  [key: string]: unknown;
}

export interface QueryField {
  name: string;
  dataType: number;
}

export interface ExecuteSuccess {
  success: true;
  data: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
  fields: QueryField[];
  executionPlan: PlanNode | null;
}

export interface ExecuteError {
  success: false;
  error: string;
}

export type ExecuteResponse = ExecuteSuccess | ExecuteError;

export async function executeQuery(
  query: string,
  analyze: boolean
): Promise<ExecuteResponse> {
  try {
    const { data } = await api.post<ExecuteResponse>("/queries/execute", {
      query,
      analyze,
    });
    return data;
  } catch (err) {
    const e = err as { response?: { data?: ExecuteError }; message?: string };
    if (e.response?.data) return e.response.data;
    return { success: false, error: e.message || "Network error" };
  }
}
