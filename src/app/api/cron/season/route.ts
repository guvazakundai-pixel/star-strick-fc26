import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { recomputePlayerRankings } from "@/lib/ranking";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "zimfcpro-cron-2024";

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];
  const now = new Date().toISOString();

  try {
    const completedLeagues = await db.execute({
      sql: `SELECT l.id, l.name, ls.id as season_id, ls.season_number
            FROM leagues l
            JOIN league_seasons ls ON ls.league_id = l.id
            WHERE l.status = 'LIVE' AND ls.status = 'ACTIVE'`,
      args: [],
    });

    for (const league of completedLeagues.rows as Row[]) {
      const leagueId = league.id as string;
      const seasonId = league.season_id as string;
      const seasonNumber = (league.season_number as number) || 1;

      const pendingFixtures = await db.execute({
        sql: `SELECT count(*) as c FROM league_fixtures WHERE league_id = ? AND season_id = ? AND status = 'PENDING'`,
        args: [leagueId, seasonId],
      });
      const pendingCount = Number((pendingFixtures.rows[0] as Row)?.c ?? 0);

      if (pendingCount > 0) continue;

      try {
        await db.execute({
          sql: "UPDATE league_seasons SET status = 'COMPLETED', ended_at = ? WHERE id = ?",
          args: [now, seasonId],
        });

        const newSeasonId = crypto.randomUUID();
        await db.execute({
          sql: `INSERT INTO league_seasons (id, league_id, season_number, status, created_at, started_at)
                VALUES (?,?,?,'ACTIVE',?,?)`,
          args: [newSeasonId, leagueId, seasonNumber + 1, now, now],
        });

        const participants = await db.execute({
          sql: "SELECT user_id FROM league_participants WHERE league_id = ?",
          args: [leagueId],
        });

        for (const p of participants.rows as Row[]) {
          const userId = p.user_id as string;
          await db.execute({
            sql: `INSERT OR IGNORE INTO league_standings (id, league_id, season_id, user_id, points, played, wins, draws, losses, goals_for, goals_against, goal_difference, form, updated_at)
                  VALUES (?,?,?,?,0,0,0,0,0,0,0,0,'',?)`,
            args: [crypto.randomUUID(), leagueId, newSeasonId, userId, now],
          });
        }

        results.push(`Season ${seasonNumber} completed for "${league.name}", season ${seasonNumber + 1} started`);
      } catch (e) {
        results.push(`Failed to process season for league ${leagueId}: ${e}`);
      }
    }

    try {
      const newMonth = new Date().getMonth();
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
      const seasonName = `${monthNames[newMonth]} ${new Date().getFullYear()}`;

      const existingWeekend = await db.execute({
        sql: "SELECT id FROM leagues WHERE slug = ?",
        args: [`weekend-league-${newMonth}-${new Date().getFullYear()}`],
      });

      if (existingWeekend.rows.length === 0) {
        const leagueId = crypto.randomUUID();
        const seasonId = crypto.randomUUID();

        await db.execute({
          sql: `INSERT INTO leagues (id, name, slug, description, type, status, max_players, invite_code, admin_id, created_at, updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          args: [
            leagueId,
            `Weekend League — ${seasonName}`,
            `weekend-league-${newMonth}-${new Date().getFullYear()}`,
            `Monthly weekend league for ${seasonName}. Compete for the top spot!`,
            "PUBLIC", "REGISTRATION", 64,
            `WL${newMonth}${new Date().getFullYear()}`.toUpperCase(),
            "system",
            now, now,
          ],
        });

        await db.execute({
          sql: `INSERT INTO league_seasons (id, league_id, season_number, status, created_at, started_at)
                VALUES (?,?,'1','ACTIVE',?,?)`,
          args: [seasonId, leagueId, now, now],
        });

        results.push(`Created monthly weekend league: ${seasonName}`);
      }
    } catch (e) {
      results.push(`Failed to create weekend league: ${e}`);
    }

    try {
      await recomputePlayerRankings();
      results.push("Rankings recomputed");
    } catch (e) {
      results.push(`Rankings recomputation failed: ${e}`);
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: now,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}