import { createClient, type Client } from "@libsql/client";

const globalForLibsql = globalThis as unknown as { libsql?: Client };

function createLibsqlClient() {
  if (process.env.TURSO_DATABASE_URL) {
    return createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return createClient({
    url: `file:${process.env.DATABASE_URL?.replace("file:", "") || "./dev.db"}`,
  });
}

export const db = globalForLibsql.libsql ?? createLibsqlClient();

if (process.env.NODE_ENV !== "production") globalForLibsql.libsql = db;