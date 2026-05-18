import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  for (const t of ["leagues", "league_seasons", "league_participants"]) {
    console.log(`\n=== ${t} ===`);
    const schema = await client.execute(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='${t}'`,
    );
    console.log(schema.rows[0]?.sql ?? "(missing)");
  }

  const rows = await client.execute("SELECT * FROM leagues LIMIT 5");
  console.log("\n=== leagues data ===");
  console.log(JSON.stringify(rows.rows, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
