import { Client } from "pg";

export async function getTargetClient(): Promise<Client> {
  const connectionString = process.env.TARGET_DB_URL;

  if (!connectionString) {
    throw new Error("TARGET_DB_URL is not defined in .env");
  }

  const client = new Client({ connectionString });
  await client.connect();

  await client.query("SET statement_timeout = '10s';");

  return client;
}
