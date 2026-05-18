import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import { updateStandingsFromFixtureDb } from "@/lib/league-engine";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  try { await db.execute({ sql: "ALTER TABLE league_seasons ADD COLUMN created_at TEXT", args: [] }); } catch {}
  try { await db.execute({ sql: "ALTER TABLE league_seasons ADD COLUMN started_at TEXT", args: [] }); } catch {}
  try { await db.execute({ sql: "ALTER TABLE league_seasons ADD COLUMN ended_at TEXT", args: [] }); } catch {}
  try { await db.execute({ sql: "ALTER TABLE league_seasons ADD COLUMN season_number INTEGER DEFAULT 1", args: [] }); } catch {}
  const { fixtureId, homeScore, awayScore } = await req.json();

  if (homeScore === undefined || awayScore === undefined || homeScore < 0 || awayScore < 0) {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
  }

  try {
    const fixtureRows = await db.execute({
      sql: "SELECT * FROM league_fixtures WHERE id=? AND league_id=?",
      args: [fixtureId, id],
    });
    if (fixtureRows.rows.length === 0) return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
    const fixture = fixtureRows.rows[0] as any;
    if (fixture.status === "COMPLETED") return NextResponse.json({ error: "Already completed" }, { status: 409 });

    const season = await db.execute({
      sql: "SELECT id FROM league_seasons WHERE league_id=? AND status='ACTIVE' ORDER BY season_number DESC LIMIT 1",
      args: [id],
    });
    if (season.rows.length === 0) return NextResponse.json({ error: "No active season" }, { status: 400 });
    const seasonId = (season.rows[0] as any).id;

    await db.execute({
      sql: "UPDATE league_fixtures SET home_score=?, away_score=?, status='COMPLETED', completed_at=? WHERE id=?",
      args: [homeScore, awayScore, new Date().toISOString(), fixtureId],
    });

    await updateStandingsFromFixtureDb(id, seasonId, {
      homeUserId: fixture.home_user_id,
      awayUserId: fixture.away_user_id,
      homeScore,
      awayScore,
    });

    return NextResponse.json({ success: true, data: { fixtureId, homeScore, awayScore } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
