import { db } from "./db";
import { prisma } from "./prisma";

async function seedMissingStats() {
  console.log("Seeding missing player_stats and player_rankings...");

  const users = await db.execute({
    sql: "SELECT id FROM users",
    args: [],
  });

  let created = 0;

  for (const row of users.rows) {
    const userId = (row as Record<string, unknown>).id as string;
    const now = new Date().toISOString();

    const existing = await db.execute({
      sql: "SELECT id FROM player_stats WHERE user_id = ?",
      args: [userId],
    });

    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO player_stats (id, user_id, matches_played, wins, losses, draws, goals_scored, goals_conceded, skill_rating, points, form_score, win_streak, mvp_count, form_history, updated_at)
              VALUES (?, ?, 0, 0, 0, 0, 0, 0, 1000, 0, 0, 0, 0, '', ?)`,
        args: [crypto.randomUUID(), userId, now],
      });
      console.log(`  Created player_stats for ${userId}`);
      created++;
    }

    try {
      await prisma.playerRanking.upsert({
        where: { userId },
        create: { id: crypto.randomUUID(), userId, rankPosition: 999, prevPosition: null, rankChange: 0, points: 0, finalScore: 0 },
        update: {},
      });
    } catch {}
  }

  console.log(`Done. Created ${created} player_stats rows.`);
}

seedMissingStats().catch(console.error);