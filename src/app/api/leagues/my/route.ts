import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

type Row = Record<string, unknown>;

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const leagues = await db.execute({
      sql: `SELECT l.id, l.name, l.slug, l.type, l.status, l.description, l.max_players, l.created_at,
        (SELECT count(*) FROM league_participants lp WHERE lp.league_id = l.id) as participant_count,
        ls.points, ls.played, ls.wins, ls.losses, ls.draws, ls.goals_for AS goalsFor, ls.goals_against AS goalsAgainst,
        ls.goal_difference AS goalDiff, ls.form,
        (SELECT lf.matchday FROM league_fixtures lf WHERE lf.league_id = l.id AND lf.status = 'PENDING' AND (lf.home_user_id = ? OR lf.away_user_id = ?) ORDER BY lf.matchday ASC LIMIT 1) as next_matchday,
        (SELECT count(*) FROM league_fixtures lf2 WHERE lf2.league_id = l.id) as total_fixtures,
        (SELECT count(*) FROM league_fixtures lf3 WHERE lf3.league_id = l.id AND lf3.status = 'COMPLETED') as completed_fixtures,
        (SELECT count(*) FROM league_fixtures lf4 WHERE lf4.league_id = l.id AND lf4.status = 'PENDING') as pending_fixtures,
        u.username as admin_name
      FROM leagues l
      JOIN league_participants lp2 ON lp2.league_id = l.id AND lp2.user_id = ?
      LEFT JOIN league_standings ls ON ls.league_id = l.id AND ls.user_id = ?
      LEFT JOIN users u ON u.id = l.admin_id
      ORDER BY l.created_at DESC`,
      args: [auth.session.userId, auth.session.userId, auth.session.userId, auth.session.userId],
    });

    const myLeagues = leagues.rows.map((r: any) => ({
      id: r.id, name: r.name, slug: r.slug, type: r.type, status: r.status,
      description: r.description, maxPlayers: r.max_players,
      participantCount: Number(r.participant_count) || 0,
      myStats: {
        points: Number(r.points) || 0, played: Number(r.played) || 0,
        wins: Number(r.wins) || 0, draws: Number(r.draws) || 0, losses: Number(r.losses) || 0,
        goalsFor: Number(r.goalsFor) || 0, goalsAgainst: Number(r.goalsAgainst) || 0,
        goalDiff: Number(r.goalDiff) || 0, form: r.form || "",
      },
      nextMatchday: r.next_matchday ? Number(r.next_matchday) : null,
      totalFixtures: Number(r.total_fixtures) || 0,
      completedFixtures: Number(r.completed_fixtures) || 0,
      pendingFixtures: Number(r.pending_fixtures) || 0,
      adminName: r.admin_name,
    }));

    return NextResponse.json({ success: true, data: myLeagues });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
