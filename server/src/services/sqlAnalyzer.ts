import { Parser } from "node-sql-parser";

const parser = new Parser();

export type Suggestion = {
  sev: "warning" | "info" | "danger";
  title: string;
  body: string;
  category: string;
  sql?: string;
};

export function analyzeSQL(query: string): Suggestion[] {
  let ast: any;

  try {
    ast = parser.astify(query);
  } catch {
    return [
      {
        sev: "danger",
        title: "Invalid SQL",
        body: "Query could not be parsed.",
        category: "Syntax",
      },
    ];
  }

  // Handle multiple statements (rare but safe)
  if (Array.isArray(ast)) {
    ast = ast[0];
  }

  const suggestions: Suggestion[] = [];

  // 🔍 SELECT * detection (FIXED)
  if (hasSelectStar(ast)) {
    suggestions.push({
      sev: "warning",
      title: "Avoid SELECT *",
      body: "Fetching all columns increases I/O and slows queries.",
      category: "Performance",
      sql: generateSelectReplacement(query),
    });
  }

  // 🔍 WHERE check (safer)
  if (!hasWhere(ast)) {
    suggestions.push({
      sev: "info",
      title: "No WHERE clause",
      body: "This may cause a full table scan.",
      category: "Performance",
    });
  }

  // 🔍 LIKE '%abc%' detection (slightly improved)
  if (hasLeadingWildcard(ast)) {
    suggestions.push({
      sev: "warning",
      title: "Leading wildcard in LIKE",
      body: "LIKE '%value%' prevents index usage.",
      category: "Performance",
    });
  }

  // 🔍 JOIN without ON
  if (hasBadJoin(ast)) {
    suggestions.push({
      sev: "danger",
      title: "JOIN without condition",
      body: "This creates a Cartesian product.",
      category: "Logic",
    });
  }

  // 🔍 LIMIT check
  if (!ast.limit) {
    suggestions.push({
      sev: "info",
      title: "No LIMIT clause",
      body: "Returning too many rows can slow performance.",
      category: "Performance",
    });
  }

  return suggestions;
}

/* ================= HELPERS ================= */

function hasSelectStar(ast: any): boolean {
  if (!ast.columns) return false;

  return ast.columns.some((col: any) => {
    return (
      (col.expr?.type === "star") ||
      (col.expr?.type === "column_ref" && col.expr.column === "*")
    );
  });
}

function hasWhere(ast: any): boolean {
  return ast.where !== null && ast.where !== undefined;
}

function hasLeadingWildcard(ast: any): boolean {
  const whereStr = JSON.stringify(ast.where || "");
  return whereStr.includes("LIKE '%");
}

function hasBadJoin(ast: any): boolean {
  if (!ast.from) return false;

  return ast.from.some(
    (table: any) => table.join && !table.on
  );
}

/**
 * Simple SELECT * replacement (safe placeholder)
 */
function generateSelectReplacement(query: string): string {
  return query.replace(/\*/g, "column1, column2");
}