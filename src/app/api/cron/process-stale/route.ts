import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "zimfcpro-cron-2024";

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];
  const now = new Date();

  try {
    const expiredRequests = await db.execute({
      sql: `SELECT mr.id, mr.sender_id, mr.receiver_id FROM match_requests mr
            WHERE mr.status_raw = 'PENDING_ACCEPTANCE' AND mr.expires_at < ?`,
      args: [now.toISOString()],
    });

    for (const row of expiredRequests.rows as Row[]) {
      try {
        await db.execute({
          sql: "UPDATE match_requests SET status = 'EXPIRED', status_raw = 'EXPIRED' WHERE id = ?",
          args: [row.id],
        });
        results.push(`Expired match request ${row.id}`);
      } catch (e) {
        results.push(`Failed to expire request ${row.id}: ${e}`);
      }
    }

    const forfeitHours = 48;
    const forfeitDeadline = new Date(now.getTime() - forfeitHours * 60 * 60 * 1000).toISOString();

    const leagueFixtures = await db.execute({
      sql: `SELECT lf.id, lf.league_id, lf.season_id, lf.home_user_id, lf.away_user_id,
                   lf.scheduled_at, lf.status
            FROM league_fixtures lf
            JOIN leagues l ON l.id = lf.league_id
            WHERE lf.status = 'PENDING' AND l.status = 'LIVE'
            AND lf.scheduled_at IS NOT NULL AND lf.scheduled_at < ?`,
      args: [forfeitDeadline],
    });

    for (const fixture of leagueFixtures.rows as Row[]) {
      try {
        const homePlayerId = String(fixture.home_user_id);
        const awayPlayerId = String(fixture.away_user_id);
        const seasonId = String(fixture.season_id);
        const leagueId = String(fixture.league_id);

        await db.execute({
          sql: `UPDATE league_fixtures SET status = 'COMPLETED', home_score = 0, away_score = 3, completed_at = ? WHERE id = ?`,
          args: [now.toISOString(), fixture.id],
        });

        const awayExisting = await db.execute({
          sql: "SELECT id, points, played, wins, draws, losses, goals_for, goals_against, goal_difference, form FROM league_standings WHERE league_id = ? AND season_id = ? AND user_id = ?",
          args: [leagueId, seasonId, awayPlayerId],
        });
        const awayRow = awayExisting.rows[0] as Row | undefined;
        const awayPlayed = Number(awayRow?.played ?? 0) + 1;
        const awayWins = Number(awayRow?.wins ?? 0) + 1;
        const awayPoints = Number(awayRow?.points ?? 0) + 3;
        const awayGF = Number(awayRow?.goals_for ?? 0) + 3;
        const awayGA = Number(awayRow?.goals_against ?? 0);
        const awayGD = awayGF - awayGA;
        const awayForm = (String(awayRow?.form ?? "") + "W").slice(-5);
        const awayId = awayRow?.id ?? crypto.randomUUID();

        await db.execute({
          sql: `INSERT OR REPLACE INTO league_standings (id, league_id, season_id, user_id, points, played, wins, draws, losses, goals_for, goals_against, goal_difference, form, updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          args: [awayId, leagueId, seasonId, awayPlayerId, awayPoints, awayPlayed, awayWins, Number(awayRow?.draws ?? 0), Number(awayRow?.losses ?? 0), awayGF, awayGA, awayGD, awayForm, now.toISOString()],
        });

        const homeExisting = await db.execute({
          sql: "SELECT id, points, played, wins, draws, losses, goals_for, goals_against, goal_difference, form FROM league_standings WHERE league_id = ? AND season_id = ? AND user_id = ?",
          args: [leagueId, seasonId, homePlayerId],
        });
        const homeRow = homeExisting.rows[0] as Row | undefined;
        const homePlayed = Number(homeRow?.played ?? 0) + 1;
        const homeLosses = Number(homeRow?.losses ?? 0) + 1;
        const homeGF = Number(homeRow?.goals_for ?? 0);
        const homeGA = Number(homeRow?.goals_against ?? 0) + 3;
        const homeGD = homeGF - homeGA;
        const homeForm = (String(homeRow?.form ?? "") + "L").slice(-5);
        const homeId = homeRow?.id ?? crypto.randomUUID();

        await db.execute({
          sql: `INSERT OR REPLACE INTO league_standings (id, league_id, season_id, user_id, points, played, wins, draws, losses, goals_for, goals_against, goal_difference, form, updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          args: [homeId, leagueId, seasonId, homePlayerId, Number(homeRow?.points ?? 0), homePlayed, Number(homeRow?.wins ?? 0), Number(homeRow?.draws ?? 0), homeLosses, homeGF, homeGA, homeGD, homeForm, now.toISOString()],
        });

        results.push(`Auto-forfeited league fixture ${fixture.id} (away wins 3-0)`);
      } catch (e) {
        results.push(`Failed to forfeit fixture ${fixture.id}: ${e}`);
      }
    }

    const tournamentFixtures = await db.execute({
      sql: `SELECT tm.id, tm.tournament_id, tm.player1_id, tm.player2_id, tm.status
            FROM tournament_matches tm
            JOIN tournaments t ON t.id = tm.tournament_id
            WHERE tm.status IN ('PENDING', 'READY')
            AND t.status = 'LIVE'
            AND tm.scheduled_at IS NOT NULL AND tm.scheduled_at < ?`,
      args: [forfeitDeadline],
    });

    for (const match of tournamentFixtures.rows as Row[]) {
      try {
        await db.execute({
          sql: `UPDATE tournament_matches SET status = 'COMPLETED', winner_id = COALESCE(player2_id, player1_id), score1 = 0, score2 = 3, completed_at = ? WHERE id = ?`,
          args: [now.toISOString(), match.id],
        });
        results.push(`Auto-forfeited tournament match ${match.id}`);
      } catch (e) {
        results.push(`Failed to forfeit tournament match ${match.id}: ${e}`);
      }
    }

    const activeMatches = await db.execute({
      sql: `SELECT id, player1_id, player2_id, created_at FROM match_reports
            WHERE status_raw IN ('ACTIVE', 'SCORE_SUBMITTED', 'PENDING_VERIFICATION')
            AND created_at < ?`,
      args: [new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString()],
    });

    for (const match of activeMatches.rows as Row[]) {
      try {
        await db.execute({
          sql: "UPDATE match_reports SET status = 'AUTO_FORFEIT', status_raw = 'AUTO_FORFEIT' WHERE id = ?",
          args: [match.id],
        });
        results.push(`Auto-forfeited stale match ${match.id} (72h inactive)`);
      } catch (e) {
        results.push(`Failed to auto-forfeit match ${match.id}: ${e}`);
      }
    }

    try {
      const inactiveThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const inactiveResult = await db.execute({
        sql: `UPDATE player_stats SET skill_rating = MAX(100, skill_rating - 10)
              WHERE user_id IN (
                SELECT u.id FROM users u
                LEFT JOIN match_reports mr ON (mr.player1_id = u.id OR mr.player2_id = u.id)
                WHERE u.last_active_at IS NOT NULL AND u.last_active_at < ?
                GROUP BY u.id
                HAVING COUNT(mr.id) = 0
              ) AND skill_rating > 100`,
        args: [inactiveThreshold],
      });
      if (inactiveResult.rowsAffected > 0) {
        results.push(`Applied inactivity penalty to ${inactiveResult.rowsAffected} players`);
      }
    } catch (e) {
      results.push(`Inactivity penalty failed: ${e}`);
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: now.toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}