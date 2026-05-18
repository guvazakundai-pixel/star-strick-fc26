import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  const tables = await client.execute(
    "SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name",
  );
  const refTargets = ["leagues", "league_seasons", "league_participants"];

  console.log("\nTables referencing the old league tables:");
  for (const row of tables.rows) {
    const sql = String(row.sql ?? "");
    for (const t of refTargets) {
      if (new RegExp(`REFERENCES\\s+"?${t}"?\\b`, "i").test(sql)) {
        console.log(`  ${row.name} → references ${t}`);
      }
    }
  }

  console.log("\nTables whose names contain 'league':");
  for (const row of tables.rows) {
    if (String(row.name).includes("league")) console.log(`  ${row.name}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
