"use client";

import { create } from "zustand";

interface QueryState {
  query: string;
  analyze: boolean;
  setQuery: (q: string) => void;
  setAnalyze: (a: boolean) => void;
}

const DEFAULT_QUERY = `SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
LIMIT 10;`;

export const useQueryStore = create<QueryState>((set) => ({
  query: DEFAULT_QUERY,
  analyze: true,
  setQuery: (query) => set({ query }),
  setAnalyze: (analyze) => set({ analyze }),
}));
