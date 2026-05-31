import { createClient, type Client } from "@libsql/client";

const globalForLibsql = globalThis as unknown as { libsql?: Client };

function createLibsqlClient(): Client {
  const useTurso = process.env.TURSO_DATABASE_URL && process.env.USE_TURSO === "true";
  if (useTurso) {
    return createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  const dbPath = process.env.DATABASE_URL || "file:./prisma/dev.db";
  const url = dbPath.startsWith("file:") ? dbPath : `file:${dbPath}`;
  return createClient({ url });
}

if (!globalForLibsql.libsql) {
  globalForLibsql.libsql = createLibsqlClient();
}

export const db: Client = globalForLibsql.libsql;