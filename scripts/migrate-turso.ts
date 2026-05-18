import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { config } from "dotenv";

config();

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  const dropOrder = [
    // Drop child/dependent tables before parents
    "match_screenshots",
    "match_disputes",
    "league_playoff_matches",
    "league_standings",
    "league_invite_codes",
    "league_fixtures",
    "league_participants",
    "league_seasons",
    "leagues",
    // Also drop my new tables (clean slate) so we can recreate
    "fixtures",
    "standings",
    "invite_codes",
    "league_members",
  ];

  // PRAGMA to ignore FK violations during the drop sweep
  await client.execute("PRAGMA foreign_keys = OFF");

  for (const t of dropOrder) {
    try {
      await client.execute(`DROP TABLE IF EXISTS "${t}"`);
      console.log(`✓ dropped ${t}`);
    } catch (e) {
      console.log(`× drop ${t}: ${(e as Error).message.slice(0, 80)}`);
    }
  }

  const ddl = readFileSync(process.argv[2], "utf8");
  const stmts = ddl.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean);
  for (const s of stmts) {
    await client.execute(s);
    console.log(`✓ ${s.replace(/\s+/g, " ").slice(0, 70)}…`);
  }
  console.log(`\nDone. ${stmts.length} create statements applied.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
