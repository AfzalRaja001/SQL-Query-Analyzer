// Wraps a callback in a READ ONLY transaction so writes are rejected at the
// database level regardless of the connecting role's privileges.
interface Queryable {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query(text: string): Promise<any>;
}

export async function withSafeClient<T>(
  client: Queryable,
  fn: (q: (text: string) => Promise<any>) => Promise<T>  // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<T> {
  await client.query("BEGIN TRANSACTION READ ONLY");
  await client.query("SET LOCAL statement_timeout = '10s'");
  await client.query("SET LOCAL lock_timeout = '2s'");
  await client.query("SET LOCAL idle_in_transaction_session_timeout = '15s'");
  try {
    const result = await fn((text) => client.query(text));
    await client.query("ROLLBACK");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  }
}