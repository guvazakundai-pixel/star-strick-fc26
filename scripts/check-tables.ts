import { db } from "../src/lib/db";

const tables = [
  "challenges", "challenge_results", "challenge_audit_log",
  "user_activities", "club_activities", "notifications_v2",
  "player_stats", "player_rankings", "points_log", "match_reports",
  "users"
];

async function main() {
  for (const t of tables) {
    try {
      const r = await db.execute(`SELECT count(*) as c FROM "${t}"`);
      console.log(`  ${t}: ${r.rows[0].c} rows`);
    } catch(e: any) {
      console.log(`  ${t}: MISSING - ${e.message}`);
    }
  }
}
main();
