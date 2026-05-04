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

  suggestions?: {
    sev: "warning" | "info" | "danger";
    title: string;
    body: string;
    category: string;
    sql?: string;
  }[];
}

export interface ExecuteError {
  success: false;
  error: string;
}

export type ExecuteResponse = ExecuteSuccess | ExecuteError;

export async function executeQuery(
  query: string,
  analyze: boolean,
  connectionId?: string | null
): Promise<ExecuteResponse> {
  try {
    const { data } = await api.post<ExecuteResponse>("/queries/execute", {
      query,
      analyze,
      ...(connectionId ? { connectionId } : {}),
    });
    return data;
  } catch (err) {
    const e = err as { response?: { data?: ExecuteError }; message?: string };
    if (e.response?.data) return e.response.data;
    return { success: false, error: e.message || "Network error" };
  }
}

// ── Connections ──────────────────────────────────────────────────────────────

export interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  sslMode: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface CreateConnectionInput {
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  sslMode?: string;
}

export async function listConnections(): Promise<Connection[]> {
  const { data } = await api.get<{ success: true; data: Connection[] }>("/connections");
  return data.data;
}

export async function createConnection(input: CreateConnectionInput): Promise<Connection> {
  const { data } = await api.post<{ success: true; data: Connection }>("/connections", input);
  return data.data;
}

export async function deleteConnection(id: string): Promise<void> {
  await api.delete(`/connections/${id}`);
}

export async function testConnection(id: string): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  try {
    const { data } = await api.post<{ success: boolean; latencyMs?: number; error?: string }>(
      `/connections/${id}/test`
    );
    return { ok: data.success, latencyMs: data.latencyMs, error: data.error };
  } catch (err) {
    const e = err as { response?: { data?: { error?: string } }; message?: string };
    return { ok: false, error: e.response?.data?.error ?? e.message ?? "Test failed" };
  }
}

// ── Compare ───────────────────────────────────────────────────────────────────

export interface ParsedPlanNode {
  nodeType: string;
  totalCost: number;
  estimatedRows: number;
  actualTimeMs: number;
  children: ParsedPlanNode[];
}

export interface CompareQueryResult {
  queryId: number;
  executionTimeMs: number;
  totalCost: number;
  plan: ParsedPlanNode;
  suggestions: Array<{ severity?: string; category?: string; description?: string }>;
}

export interface CompareSuccess {
  success: true;
  winner: "queryA" | "queryB" | "tie";
  diffPercentage: number;
  resultsA: CompareQueryResult;
  resultsB: CompareQueryResult;
}

export interface CompareError {
  success: false;
  error: string;
}

export type CompareResponse = CompareSuccess | CompareError;

export async function compareQueries(queryA: string, queryB: string): Promise<CompareResponse> {
  try {
    const { data } = await api.post<CompareResponse>("/queries/compare", { queryA, queryB });
    return data;
  } catch (err) {
    const e = err as { response?: { data?: CompareError }; message?: string };
    if (e.response?.data) return e.response.data;
    return { success: false, error: e.message || "Network error" };
  }
}

// ── History ───────────────────────────────────────────────────────────────────

export interface HistoryItem {
  id: string | number;
  sqlText: string;
  executionTimeMs: number;
  rowCount: number;
  isFavorite: boolean;
  createdAt: string;
  suggestions: Array<{ severity?: string; category?: string; description?: string }>;
  benchmarks: Array<{ avgTimeMs: number; iterations: number }>;
}

export interface HistoryMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export type HistoryType = "all" | "slow" | "favorites";
export type HistorySort = "newest" | "slowest" | "fastest";

export async function getHistory(params: {
  type?: HistoryType;
  sort?: HistorySort;
  limit?: number;
  offset?: number;
}): Promise<{ data: HistoryItem[]; meta: HistoryMeta }> {
  const { data } = await api.get<{ success: true; data: HistoryItem[]; meta: HistoryMeta }>(
    "/queries/history",
    { params }
  );
  return { data: data.data, meta: data.meta };
}

export async function toggleFavorite(id: string | number): Promise<{ id: string | number; isFavorite: boolean }> {
  const { data } = await api.patch<{ success: true; data: { id: string | number; isFavorite: boolean } }>(
    `/queries/history/${id}/favorite`
  );
  return data.data;
}
