import { Request, Response } from "express";
import { Client } from "pg";
import {
  dbListConnections,
  dbFindConnection,
  dbCreateConnection,
  dbDeleteConnection,
} from "../db/adminDb";
import { encrypt, decrypt } from "../services/encryption";
import { getOrCreatePool, removePool } from "../services/connectionPool";

/** GET /api/v1/connections */
export async function listConnections(_req: Request, res: Response): Promise<void> {
  const connections = await dbListConnections();
  res.json({ success: true, data: connections });
}

/** POST /api/v1/connections */
export async function createConnection(req: Request, res: Response): Promise<void> {
  const { name, host, port, database, username, password, sslMode = "prefer" } = req.body;

  if (!name || !host || !database || !username || !password) {
    res.status(400).json({ success: false, error: "name, host, database, username, and password are required." });
    return;
  }

  const parsedPort = Number(port ?? 5432);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    res.status(400).json({ success: false, error: "port must be an integer between 1 and 65535." });
    return;
  }

  // Probe before saving
  const probeClient = new Client({
    host,
    port: parsedPort,
    database,
    user: username,
    password,
    ssl: sslMode === "disable" ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });

  try {
    await probeClient.connect();
    await probeClient.query("SELECT 1");
  } catch (err) {
    res.status(400).json({ success: false, error: `Could not connect: ${(err as Error).message}` });
    return;
  } finally {
    await probeClient.end().catch(() => {});
  }

  const conn = await dbCreateConnection({
    name,
    host,
    port: parsedPort,
    database,
    username,
    secretEnc: encrypt(password),
    sslMode,
  });

  res.status(201).json({ success: true, data: conn });
}

/** DELETE /api/v1/connections/:id */
export async function deleteConnection(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  const existing = await dbFindConnection(id);
  if (!existing) {
    res.status(404).json({ success: false, error: "Connection not found." });
    return;
  }

  removePool(id);
  await dbDeleteConnection(id);
  res.status(204).send();
}

/** POST /api/v1/connections/:id/test */
export async function testConnection(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  const conn = await dbFindConnection(id);
  if (!conn) {
    res.status(404).json({ success: false, error: "Connection not found." });
    return;
  }

  let password: string;
  try {
    password = decrypt(conn.secretEnc);
  } catch {
    res.status(500).json({ success: false, error: "Failed to decrypt connection credentials." });
    return;
  }

  const probeClient = new Client({
    host: conn.host,
    port: conn.port,
    database: conn.database,
    user: conn.username,
    password,
    ssl: conn.sslMode === "disable" ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });

  try {
    const start = performance.now();
    await probeClient.connect();
    await probeClient.query("SELECT 1");
    const latencyMs = parseFloat((performance.now() - start).toFixed(2));
    res.json({ success: true, latencyMs });
  } catch (err) {
    res.json({ success: false, error: (err as Error).message });
  } finally {
    await probeClient.end().catch(() => {});
  }

  // Warm up the pool after a successful test (best-effort)
  try {
    const pw = decrypt(conn.secretEnc);
    getOrCreatePool(id, {
      host: conn.host,
      port: conn.port,
      database: conn.database,
      user: conn.username,
      password: pw,
      ssl: conn.sslMode === "disable" ? false : { rejectUnauthorized: false },
      max: 5,
    });
  } catch {
    // ignore
  }
}