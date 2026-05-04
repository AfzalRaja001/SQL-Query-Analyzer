import { Pool, PoolConfig } from "pg";

const MAX_POOLS = 20;
const IDLE_MS = 5 * 60 * 1000;

interface PoolEntry {
  pool: Pool;
  timer: ReturnType<typeof setTimeout>;
}

const pools = new Map<string, PoolEntry>();

function evict(id: string): void {
  const entry = pools.get(id);
  if (!entry) return;
  entry.pool.end().catch(() => {});
  pools.delete(id);
  console.log(`[pool] evicted connection ${id}`);
}

function resetTimer(id: string): void {
  const entry = pools.get(id);
  if (!entry) return;
  clearTimeout(entry.timer);
  entry.timer = setTimeout(() => evict(id), IDLE_MS);
  entry.timer.unref();
}

export function getOrCreatePool(id: string, config: PoolConfig): Pool {
  if (pools.has(id)) {
    resetTimer(id);
    return pools.get(id)!.pool;
  }

  // Evict the oldest entry when at capacity (Map preserves insertion order)
  if (pools.size >= MAX_POOLS) {
    const oldestId = pools.keys().next().value as string;
    evict(oldestId);
  }

  const pool = new Pool(config);
  const timer = setTimeout(() => evict(id), IDLE_MS);
  timer.unref();
  pools.set(id, { pool, timer });
  console.log(`[pool] created pool for connection ${id}`);
  return pool;
}

export function removePool(id: string): void {
  evict(id);
}