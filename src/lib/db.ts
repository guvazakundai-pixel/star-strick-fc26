import { createClient, type Client } from "@libsql/client";

const globalForLibsql = globalThis as unknown as { libsql?: Client };

function createLibsqlClient() {
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

export const db = globalForLibsql.libsql ?? createLibsqlClient();

if (process.env.NODE_ENV !== "production") globalForLibsql.libsql = db;