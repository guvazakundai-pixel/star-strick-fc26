import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { config } from "dotenv";

config();

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  // Drop my mistakenly-added tables and any half-applied remnants
  const dropOrder = [
    "fixtures",
    "standings",
    "invite_codes",
    "league_members",
    "match_screenshots",
    "match_disputes",
    "league_playoff_matches",
    "league_fixtures",
    "league_standings",
    "league_invite_codes",
    "league_participants",
    "league_seasons",
    "leagues",
  ];

  await client.execute("PRAGMA foreign_keys = OFF");
  for (const t of dropOrder) {
    try {
      await client.execute(`DROP TABLE IF EXISTS "${t}"`);
      console.log(`✓ dropped ${t}`);
    } catch (e) {
      console.log(`× ${t}: ${(e as Error).message.slice(0, 80)}`);
    }
  }

  // Recreate from proper remote DDL
  const ddl = readFileSync(process.argv[2], "utf8");
  const stmts = ddl.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean);
  for (const s of stmts) {
    try {
      await client.execute(s);
      console.log(`✓ ${s.replace(/\s+/g, " ").slice(0, 80)}…`);
    } catch (e) {
      console.log(`× ${s.slice(0, 60)}: ${(e as Error).message.slice(0, 80)}`);
    }
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
