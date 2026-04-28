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

  const suggestions: Suggestion[] = [];

  runSelectStarRule(ast, suggestions, query);
  runWhereRule(ast, suggestions);
  runLikeRule(ast, suggestions);
  runJoinRule(ast, suggestions);
  runLimitRule(ast, suggestions);

  return suggestions;
}

function runSelectStarRule(ast: any, suggestions: Suggestion[], query: string) {
  if (ast.columns === "*") {
    suggestions.push({
      sev: "warning",
      title: "Avoid SELECT *",
      body: "Fetching all columns increases I/O and slows queries.",
      category: "Performance",
      sql: query.replace("*", "id, name"), // simple rewrite
    });
  }
}

function runWhereRule(ast: any, suggestions: Suggestion[]) {
  if (!ast.where) {
    suggestions.push({
      sev: "info",
      title: "No WHERE clause",
      body: "This may cause a full table scan on large datasets.",
      category: "Performance",
    });
  }
}

function runLikeRule(ast: any, suggestions: Suggestion[]) {
  const where = JSON.stringify(ast.where || "");

  if (where.includes("LIKE '%")) {
    suggestions.push({
      sev: "warning",
      title: "Leading wildcard in LIKE",
      body: "LIKE '%value%' prevents index usage.",
      category: "Performance",
    });
  }
}

function runJoinRule(ast: any, suggestions: Suggestion[]) {
  if (!ast.from) return;

  for (const table of ast.from) {
    if (table.join && !table.on) {
      suggestions.push({
        sev: "danger",
        title: "JOIN without condition",
        body: "This creates a Cartesian product and is very expensive.",
        category: "Logic",
      });
    }
  }
}

function runLimitRule(ast: any, suggestions: Suggestion[]) {
  if (!ast.limit) {
    suggestions.push({
      sev: "info",
      title: "No LIMIT clause",
      body: "Returning large datasets can slow down performance.",
      category: "Performance",
    });
  }
}