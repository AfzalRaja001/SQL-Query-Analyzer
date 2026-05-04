import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    pool = new Pool({ connectionString: url, max: 3 });
  }
  return pool;
}

export interface DbConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  secretEnc: string;
  sslMode: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export async function dbListConnections(): Promise<Omit<DbConnection, "secretEnc">[]> {
  const { rows } = await getPool().query<Omit<DbConnection, "secretEnc">>(
    `SELECT id, name, host, port, database, username, "sslMode", "createdAt", "lastUsedAt"
     FROM "Connection" ORDER BY "createdAt" DESC`
  );
  return rows;
}

export async function dbFindConnection(id: string): Promise<DbConnection | null> {
  const { rows } = await getPool().query<DbConnection>(
    `SELECT * FROM "Connection" WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function dbCreateConnection(
  data: Omit<DbConnection, "id" | "createdAt" | "lastUsedAt">
): Promise<Omit<DbConnection, "secretEnc">> {
  const id = crypto.randomUUID();
  const { rows } = await getPool().query<Omit<DbConnection, "secretEnc">>(
    `INSERT INTO "Connection" (id, name, host, port, database, username, "secretEnc", "sslMode", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING id, name, host, port, database, username, "sslMode", "createdAt", "lastUsedAt"`,
    [id, data.name, data.host, data.port, data.database, data.username, data.secretEnc, data.sslMode]
  );
  return rows[0]!;
}

export async function dbDeleteConnection(id: string): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `DELETE FROM "Connection" WHERE id = $1`,
    [id]
  );
  return (rowCount ?? 0) > 0;
}

export async function dbTouchConnection(id: string): Promise<void> {
  await getPool().query(
    `UPDATE "Connection" SET "lastUsedAt" = NOW() WHERE id = $1`,
    [id]
  );
}