import { Pool, PoolClient } from "pg";

/**
 * A dedicated connection pool that connects as the read-only PostgreSQL role.
 * Set READONLY_DATABASE_URL in your .env to point at the same Postgres instance
 * but with a role that only has SELECT privileges on target tables.
 *
 * Example .env:
 *   READONLY_DATABASE_URL=postgresql://readonly_user:secret@localhost:5432/mydb
 */
const pool = new Pool({
  connectionString:
    process.env.READONLY_DATABASE_URL || process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  console.error("[pg readonly pool] unexpected error:", err);
});

export async function getReadonlyClient(): Promise<PoolClient> {
  return pool.connect();
}

export default pool;
