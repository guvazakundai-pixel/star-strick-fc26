import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  const tables = ["leagues", "league_seasons", "league_participants", "league_standings", "league_invite_codes", "league_playoff_matches", "league_fixtures", "match_disputes", "match_screenshots"];
  for (const t of tables) {
    try {
      const r = await client.execute(`SELECT count(*) as c FROM "${t}"`);
      console.log(`  ${t}: ${r.rows[0].c} rows`);
    } catch (e) {
      console.log(`  ${t}: MISSING`);
    }
  }
}

main().catch(console.error);
