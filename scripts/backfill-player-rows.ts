import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { ACHIEVEMENTS } from "../src/lib/achievements";

config();

async function main() {
  const useTurso = process.env.USE_TURSO === "true";
  const client = useTurso
    ? createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      })
    : createClient({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });

  console.log(`Target: ${useTurso ? "Turso prod" : "local dev.db"}`);

  // Find players (role = PLAYER) without PlayerStats
  const missingStats = await client.execute(`
    SELECT u.id, u.username
    FROM users u
    LEFT JOIN player_stats s ON s.user_id = u.id
    WHERE u.role = 'PLAYER' AND s.id IS NULL
  `);
  console.log(`Missing PlayerStats: ${missingStats.rows.length}`);

  // Find players without PlayerRanking
  const missingRanking = await client.execute(`
    SELECT u.id, u.username
    FROM users u
    LEFT JOIN player_rankings r ON r.user_id = u.id
    WHERE u.role = 'PLAYER' AND r.id IS NULL
  `);
  console.log(`Missing PlayerRanking: ${missingRanking.rows.length}`);

  // Count for ranking start position
  const totalRow = await client.execute("SELECT count(*) as c FROM player_rankings");
  let nextRank = Number(totalRow.rows[0]?.c ?? 0) + 1;

  const now = new Date().toISOString();

  for (const row of missingStats.rows) {
    const userId = String(row.id);
    await client.execute({
      sql: "INSERT INTO player_stats (id, user_id, matches_played, wins, losses, draws, goals_scored, goals_conceded, skill_rating, points, form_score, win_streak, mvp_count, form_history, updated_at) VALUES (?, ?, 0, 0, 0, 0, 0, 0, 1000, 0, 0, 0, 0, '', ?)",
      args: [crypto.randomUUID(), userId, now],
    });
    console.log(`  + stats for @${row.username}`);
  }

  for (const row of missingRanking.rows) {
    const userId = String(row.id);
    await client.execute({
      sql: "INSERT INTO player_rankings (id, user_id, rank_position, rank_change, points, final_score, updated_at) VALUES (?, ?, ?, 0, 0, 0, ?)",
      args: [crypto.randomUUID(), userId, nextRank++, now],
    });
    console.log(`  + ranking for @${row.username} at #${nextRank - 1}`);
  }

  // Award welcome achievement to anyone missing it
  const missingWelcome = await client.execute(`
    SELECT u.id, u.username
    FROM users u
    LEFT JOIN player_achievements a ON a.user_id = u.id AND a.title = ?
    WHERE u.role = 'PLAYER' AND a.id IS NULL
  `.replace("?", `'${ACHIEVEMENTS.WELCOME.title.replace(/'/g, "''")}'`));
  console.log(`Missing welcome achievement: ${missingWelcome.rows.length}`);

  const w = ACHIEVEMENTS.WELCOME;
  for (const row of missingWelcome.rows) {
    const userId = String(row.id);
    await client.execute({
      sql: "INSERT OR IGNORE INTO player_achievements (id, user_id, title, description, icon, category, rarity, unlocked_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [crypto.randomUUID(), userId, w.title, w.description, w.icon, w.category, w.rarity, now, now],
    });
    console.log(`  + welcome for @${row.username}`);
  }

  console.log("\nBackfill complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
