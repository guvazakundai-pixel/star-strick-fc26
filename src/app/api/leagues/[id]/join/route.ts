import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import { generateRoundRobinFixtures } from "@/lib/league-engine";

type Row = Record<string, unknown>;
function uuid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try { await db.execute({ sql: "ALTER TABLE leagues ADD COLUMN max_players INTEGER DEFAULT 20", args: [] }); } catch {}
  try { await db.execute({ sql: "ALTER TABLE leagues ADD COLUMN rounds INTEGER DEFAULT 2", args: [] }); } catch {}
  try { await db.execute({ sql: "ALTER TABLE leagues ADD COLUMN home_away INTEGER DEFAULT 1", args: [] }); } catch {}
  try { await db.execute({ sql: "ALTER TABLE leagues ADD COLUMN format TEXT", args: [] }); } catch {}
  try { await db.execute({ sql: "ALTER TABLE league_seasons ADD COLUMN created_at TEXT", args: [] }); } catch {}
  try { await db.execute({ sql: "ALTER TABLE league_seasons ADD COLUMN started_at TEXT", args: [] }); } catch {}
  try { await db.execute({ sql: "ALTER TABLE league_seasons ADD COLUMN ended_at TEXT", args: [] }); } catch {}
  try { await db.execute({ sql: "ALTER TABLE league_seasons ADD COLUMN season_number INTEGER DEFAULT 1", args: [] }); } catch {}
  const { id } = await params;

  try {
    const league = await db.execute({ sql: "SELECT * FROM leagues WHERE id=?", args: [id] });
    if (league.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = await db.execute({
      sql: "SELECT id FROM league_participants WHERE league_id=? AND user_id=?",
      args: [id, auth.session.userId],
    });
    if (existing.rows.length > 0) return NextResponse.json({ error: "Already joined" }, { status: 409 });

    const count = await db.execute({
      sql: "SELECT count(*) as cnt FROM league_participants WHERE league_id=?",
      args: [id],
    });
    const l = league.rows[0] as any;
    if (Number(count.rows[0]?.cnt || 0) >= Number(l.max_players || 20)) {
      return NextResponse.json({ error: "League is full" }, { status: 409 });
    }

    const participantId = uuid();
    const standingId = uuid();

    await db.execute({
      sql: "INSERT INTO league_participants (id, league_id, user_id, joined_at) VALUES (?,?,?,?)",
      args: [participantId, id, auth.session.userId, now()],
    });

    const season = await db.execute({
      sql: "SELECT id FROM league_seasons WHERE league_id=? AND status='ACTIVE' ORDER BY season_number DESC LIMIT 1",
      args: [id],
    });
    const seasonId = (season.rows[0] as any)?.id || "";

    await db.execute({
      sql: "INSERT OR IGNORE INTO league_standings (id, league_id, season_id, user_id, points, played, wins, draws, losses, goals_for, goals_against, goal_difference) VALUES (?,?,?,?,0,0,0,0,0,0,0,0)",
      args: [standingId, id, seasonId, auth.session.userId],
    });

    return NextResponse.json({ success: true, data: { participantId } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
