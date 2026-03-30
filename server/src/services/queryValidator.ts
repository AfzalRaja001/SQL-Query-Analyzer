export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const BLACKLISTED_COMMANDS = [
  "DROP",
  "DELETE",
  "TRUNCATE",
  "ALTER",
  "CREATE",
  "INSERT",
  "UPDATE",
  "GRANT",
  "REVOKE",
];

/**
 * Checks performed:
 * 1. Query must exist and be a non-empty string.
 * 2. Query must not contain any blacklisted DDL/DML commands.
 * 3. Query must start with SELECT or WITH (common table expressions).
 */
export function validateQuery(query: unknown): ValidationResult {
  // Check 1: Ensure query exists and is a string
  if (!query || typeof query !== "string") {
    return {
      isValid: false,
      error: "Query is required and must be a non-empty string.",
    };
  }

  const trimmed = query.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: "Query cannot be empty.",
    };
  }

  // Check 2: Scan for blacklisted commands using word-boundary regex
  const upperQuery = trimmed.toUpperCase();

  for (const command of BLACKLISTED_COMMANDS) {
    const regex = new RegExp(`\\b${command}\\b`, "i");
    if (regex.test(upperQuery)) {
      return {
        isValid: false,
        error: `Forbidden command detected: "${command}". Only SELECT queries are allowed.`,
      };
    }
  }

  // Check 3: Query must start with SELECT or WITH
  if (!upperQuery.startsWith("SELECT") && !upperQuery.startsWith("WITH")) {
    return {
      isValid: false,
      error: "Only SELECT queries (or WITH/CTE queries) are allowed.",
    };
  }

  return { isValid: true };
}
