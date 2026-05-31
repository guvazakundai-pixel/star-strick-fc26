import { config } from "dotenv";
config();

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const MIGRATIONS = [
  { sql: "ALTER TABLE challenges ADD COLUMN expires_at TEXT", desc: "challenges.expires_at" },
];

async function columnExists(table: string, column: string): Promise<boolean> {
  try {
    const res = await client.execute({ sql: "PRAGMA table_info(?)", args: [table] });
    return res.rows.some((r: any) => r.name === column);
  } catch {
    // libsql PRAGMA with args might not work, try without
    const res = await client.execute(`PRAGMA table_info(${table})`);
    return res.rows.some((r: any) => r.name === column);
  }
}

async function main() {
  console.log("Force-migrating Turso production DB...");
  console.log("URL:", process.env.TURSO_DATABASE_URL);
  
  // First check what we have
  const cols = await client.execute("PRAGMA table_info(challenges)");
  console.log("Current challenge columns:", cols.rows.map((r: any) => r.name).join(", "));
  console.log("User count:", (await client.execute("SELECT count(*) as c FROM users")).rows[0]);
  
  for (const m of MIGRATIONS) {
    try {
      await client.execute(m.sql);
      console.log("APPLIED:", m.desc);
    } catch (e: any) {
      console.log("RESULT for", m.desc, ":", e.message);
    }
  }
  
  // Verify
  const colsAfter = await client.execute("PRAGMA table_info(challenges)");
  console.log("After migration columns:", colsAfter.rows.map((r: any) => r.name).join(", "));
  console.log("User count after:", (await client.execute("SELECT count(*) as c FROM users")).rows[0]);
}

main();
