import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

type Row = Record<string, unknown>;
function now() { return new Date().toISOString(); }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try { await db.execute({ sql: "ALTER TABLE leagues ADD COLUMN max_players INTEGER DEFAULT 20", args: [] }); } catch {}
  try { await db.execute({ sql: "ALTER TABLE leagues ADD COLUMN rounds INTEGER DEFAULT 2", args: [] }); } catch {}
  try { await db.execute({ sql: "ALTER TABLE leagues ADD COLUMN home_away INTEGER DEFAULT 1", args: [] }); } catch {}
  try { await db.execute({ sql: "ALTER TABLE leagues ADD COLUMN format TEXT", args: [] }); } catch {}

  try {
    const league = await db.execute({
      sql: `SELECT l.*, u.username as admin_username, u.display_name as admin_display_name, u.id as admin_user_id
            FROM leagues l JOIN users u ON u.id = l.admin_id WHERE l.id = ?`,
      args: [id],
    });

    if (league.rows.length === 0) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    const [participants, standings, fixtures, seasons] = await Promise.all([
      db.execute({
        sql: `SELECT lp.*, u.id as user_id, u.username, u.display_name, u.avatar_url
              FROM league_participants lp JOIN users u ON u.id = lp.user_id
              WHERE lp.league_id = ? ORDER BY lp.joined_at ASC`,
        args: [id],
      }),
      db.execute({
        sql: `SELECT ls.*, u.username, u.display_name, u.avatar_url
              FROM league_standings ls JOIN users u ON u.id = ls.user_id
              WHERE ls.league_id = ? ORDER BY ls.points DESC, ls.goal_difference DESC, ls.goals_for DESC`,
        args: [id],
      }),
      db.execute({
        sql: `SELECT lf.*, hu.username as home_username, hu.display_name as home_display_name,
              au.username as away_username, au.display_name as away_display_name
              FROM league_fixtures lf
              LEFT JOIN users hu ON hu.id = lf.home_user_id
              LEFT JOIN users au ON au.id = lf.away_user_id
              WHERE lf.league_id = ? ORDER BY lf.matchday ASC, lf.created_at ASC`,
        args: [id],
      }),
      db.execute({
        sql: "SELECT * FROM league_seasons WHERE league_id = ? ORDER BY season_number DESC",
        args: [id],
      }),
    ]);

    const l = league.rows[0] as any;

    return NextResponse.json({
      success: true,
      data: {
        id: l.id, name: l.name, slug: l.slug, description: l.description,
        logo: l.logo, type: l.type, status: l.status,
        maxPlayers: l.max_players, inviteCode: l.invite_code,
        rounds: l.rounds, homeAway: !!l.home_away, format: l.format,
        playoffQualifiers: Number(l.playoff_qualifiers) || 0,
        playoffType: l.playoff_type, playoffGenerated: !!l.playoff_generated,
        admin: { id: l.admin_user_id, username: l.admin_username, displayName: l.admin_display_name },
        _count: { participants: participants.rows.length },
        participants: participants.rows.map((r: any) => ({
          id: r.id, userId: r.user_id,
          user: { id: r.user_id, username: r.username, displayName: r.display_name, avatarUrl: r.avatar_url },
        })),
        standings: standings.rows.map((r: any) => ({
          id: r.id, userId: r.user_id, points: Number(r.points) || 0,
          played: Number(r.played) || 0, wins: Number(r.wins) || 0,
          draws: Number(r.draws) || 0, losses: Number(r.losses) || 0,
          goalsFor: Number(r.goals_for) || 0, goalsAgainst: Number(r.goals_against) || 0,
          goalDifference: Number(r.goal_difference) || 0, form: r.form || "",
          user: { id: r.user_id, username: r.username, displayName: r.display_name, avatarUrl: r.avatar_url },
        })),
        fixtures: fixtures.rows.map((r: any) => ({
          id: r.id, matchday: Number(r.matchday),
          homeUserId: r.home_user_id, awayUserId: r.away_user_id,
          homeScore: r.home_score !== null ? Number(r.home_score) : null,
          awayScore: r.away_score !== null ? Number(r.away_score) : null,
          status: r.status,
          homeUser: { id: r.home_user_id, username: r.home_username, displayName: r.home_display_name },
          awayUser: { id: r.away_user_id, username: r.away_username, displayName: r.away_display_name },
        })),
        seasons: seasons.rows.map((r: any) => ({
          id: r.id, seasonNumber: Number(r.season_number), status: r.status,
        })),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const league = await db.execute({ sql: "SELECT admin_id FROM leagues WHERE id=?", args: [id] });
  if (league.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const adminId = (league.rows[0] as any).admin_id;
  if (adminId !== auth.session.userId && auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updates: string[] = [];
  const args: unknown[] = [];

  if (body.name !== undefined) { updates.push("name=?"); args.push(body.name); }
  if (body.description !== undefined) { updates.push("description=?"); args.push(body.description); }
  if (body.type !== undefined) { updates.push("type=?"); args.push(body.type); }
  if (body.maxPlayers !== undefined) { updates.push("max_players=?"); args.push(body.maxPlayers); }
  if (body.rounds !== undefined) { updates.push("rounds=?"); args.push(body.rounds); }
  if (body.homeAway !== undefined) { updates.push("home_away=?"); args.push(body.homeAway ? 1 : 0); }
  if (body.status !== undefined) { updates.push("status=?"); args.push(body.status); }

  if (updates.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  updates.push("updated_at=?");
  args.push(now());
  args.push(id);

  await db.execute({ sql: `UPDATE leagues SET ${updates.join(", ")} WHERE id=?`, args });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const league = await db.execute({ sql: "SELECT admin_id FROM leagues WHERE id=?", args: [id] });
  if (league.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const adminId = (league.rows[0] as any).admin_id;
  if (adminId !== auth.session.userId && auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.execute({ sql: "DELETE FROM leagues WHERE id=?", args: [id] });
  return NextResponse.json({ success: true });
}
