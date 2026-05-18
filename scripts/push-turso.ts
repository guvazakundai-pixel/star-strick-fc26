import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { config } from "dotenv";

config();

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) throw new Error("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN required");

  const client = createClient({ url, authToken: token });

  const ddlPath = process.argv[2];
  if (!ddlPath) throw new Error("usage: tsx scripts/push-turso.ts <ddl.sql>");

  const sql = readFileSync(ddlPath, "utf8");
  const statements = sql
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, " ").slice(0, 80);
    process.stdout.write(`→ ${preview}…\n`);
    await client.execute(stmt);
  }
  console.log(`✓ Executed ${statements.length} statements`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
