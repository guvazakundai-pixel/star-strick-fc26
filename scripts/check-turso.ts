import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  );
  console.log("Tables:");
  for (const row of tables.rows) console.log(`  - ${row.name}`);

  const newTables = ["leagues", "league_seasons", "league_members", "league_participants", "fixtures", "standings", "invite_codes"];
  console.log("\nLeague table row counts:");
  for (const t of newTables) {
    try {
      const r = await client.execute(`SELECT count(*) as c FROM "${t}"`);
      console.log(`  ${t}: ${r.rows[0].c}`);
    } catch (e) {
      console.log(`  ${t}: MISSING (${(e as Error).message.slice(0, 60)})`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
