import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import { generateRoundRobinFixtures } from "@/lib/league-engine";

function uuid() { return crypto.randomUUID(); }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const league = await db.execute({ sql: "SELECT * FROM leagues WHERE id=?", args: [id] });
    if (league.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const l = league.rows[0] as any;
    if (l.admin_id !== auth.session.userId && auth.session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.execute({
      sql: "SELECT count(*) as cnt FROM league_fixtures WHERE league_id=?",
      args: [id],
    });
    if (Number(existing.rows[0]?.cnt || 0) > 0) {
      return NextResponse.json({ error: "Fixtures already generated" }, { status: 409 });
    }

    const participants = await db.execute({
      sql: "SELECT user_id FROM league_participants WHERE league_id=?",
      args: [id],
    });
    const pIds = participants.rows.map((r: any) => r.user_id);
    if (pIds.length < 2) return NextResponse.json({ error: "Need at least 2 participants" }, { status: 400 });

    const season = await db.execute({
      sql: "SELECT id FROM league_seasons WHERE league_id=? AND status='ACTIVE' ORDER BY season_number DESC LIMIT 1",
      args: [id],
    });
    if (season.rows.length === 0) return NextResponse.json({ error: "No active season" }, { status: 400 });
    const seasonId = (season.rows[0] as any).id;

    const fixtureInputs = generateRoundRobinFixtures(id, seasonId, pIds, Number(l.rounds || 2), !!l.home_away);
    for (const f of fixtureInputs) {
      await db.execute({
        sql: "INSERT INTO league_fixtures (id, league_id, season_id, matchday, home_user_id, away_user_id, status, created_at) VALUES (?,?,?,?,?,?,'PENDING',?)",
        args: [uuid(), f.leagueId, f.seasonId, f.matchday, f.homeUserId, f.awayUserId, new Date().toISOString()],
      });
    }

    await db.execute({ sql: "UPDATE leagues SET status='LIVE', updated_at=? WHERE id=?", args: [new Date().toISOString(), id] });

    return NextResponse.json({ success: true, data: { count: fixtureInputs.length } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
