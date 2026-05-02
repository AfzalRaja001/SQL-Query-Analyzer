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

  if (Array.isArray(ast)) {
    ast = ast[0];
  }

  const suggestions: Suggestion[] = [];

  /* ================= SELECT * ================= */

  if (hasSelectStar(ast)) {
    const tables = extractTables(ast);

    suggestions.push({
      sev: "warning",
      title: "Avoid SELECT *",
      body: "Fetching all columns increases I/O and slows queries.",
      category: "Performance",
      sql: generateSelectReplacement(query, tables),
    });
  }

  /* ================= WHERE ================= */

  if (!hasWhere(ast)) {
    suggestions.push({
      sev: "info",
      title: "No WHERE clause",
      body: "This may cause a full table scan.",
      category: "Performance",
    });
  } else {
    const cols = extractFilterColumns(ast);
    if (cols.length > 0) {
      suggestions.push({
        sev: "info",
        title: "Filter detected",
        body: `Query filters on: ${cols.join(", ")}. Ensure these columns are indexed.`,
        category: "Optimization",
      });
    }
  }

  /* ================= LIKE ================= */

  if (hasLeadingWildcard(ast)) {
    suggestions.push({
      sev: "warning",
      title: "Leading wildcard in LIKE",
      body: "LIKE '%value%' prevents index usage.",
      category: "Performance",
    });
  }

  /* ================= JOIN ================= */

  if (hasBadJoin(ast)) {
    suggestions.push({
      sev: "danger",
      title: "JOIN without condition",
      body: "This creates a Cartesian product.",
      category: "Logic",
    });
  }

  /* ================= LIMIT ================= */

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

  return ast.columns.some(
    (col: any) =>
      col.expr?.type === "star" ||
      (col.expr?.type === "column_ref" && col.expr.column === "*")
  );
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

  return ast.from.some((table: any) => table.join && !table.on);
}

/* ================= SMART HELPERS ================= */

function extractTables(ast: any): string[] {
  if (!ast.from) return [];

  return ast.from.map((t: any) => t.table).filter(Boolean);
}

function extractFilterColumns(ast: any): string[] {
  const cols: string[] = [];

  function traverse(node: any) {
    if (!node) return;

    if (node.type === "binary_expr") {
      if (node.left?.column) {
        cols.push(node.left.column);
      }
      traverse(node.left);
      traverse(node.right);
    }
  }

  traverse(ast.where);
  return [...new Set(cols)];
}

/**
 * Smarter SELECT * replacement
 */
function generateSelectReplacement(query: string, tables: string[]): string {
  if (tables.length === 0) {
    return query.replace(/\*/g, "column1, column2");
  }

  // basic improvement: prefix with table.*
  if (tables.length === 1) {
    return query.replace(/\*/g, `${tables[0]}.*`);
  }

  // multiple tables → avoid ambiguity
  return tables.map((t) => `${t}.*`).join(", ");
}