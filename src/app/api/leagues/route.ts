import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

type Row = Record<string, unknown>;
function uuid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  try {
    const where = type ? "WHERE l.type = ?" : "";
    const args: unknown[] = type ? [type] : [];

    const rows = await db.execute({
      sql: `SELECT l.*,
        (SELECT count(*) FROM league_participants lp WHERE lp.league_id = l.id) as participant_count,
        u.username as admin_username, u.display_name as admin_display_name
        FROM leagues l LEFT JOIN users u ON u.id = l.admin_id ${where}
        ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

    const total = await db.execute({
      sql: `SELECT count(*) as cnt FROM leagues l ${where}`,
      args,
    });

    const leagues = rows.rows.map((r: any) => ({
      id: r.id, name: r.name, slug: r.slug, description: r.description,
      type: r.type, status: r.status, maxPlayers: r.max_players,
      participantCount: Number(r.participant_count) || 0,
      admin: { username: r.admin_username, displayName: r.admin_display_name },
    }));

    return NextResponse.json({
      success: true,
      data: { leagues, total: Number(total.rows[0]?.cnt || 0), page, limit },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { name, description, type, maxPlayers, rounds, homeAway, format } = body;

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }

  try {
    let slug = slugify(name);
    const existing = await db.execute({ sql: "SELECT id FROM leagues WHERE slug=?", args: [slug] });
    if (existing.rows.length > 0) slug = slug + "-" + Date.now().toString(36);

    const leagueId = uuid();
    const seasonId = uuid();
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    await db.execute({
      sql: `INSERT INTO leagues (id, name, slug, description, type, status, max_players, rounds, home_away, invite_code, admin_id, format, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        leagueId, name.trim(), slug, description || null,
        type || "PUBLIC", "REGISTRATION", maxPlayers || 20,
        rounds || 2, homeAway !== false, inviteCode,
        auth.session.userId, format || "ROUND_ROBIN", now(), now(),
      ],
    });

    await db.execute({
      sql: `INSERT INTO league_seasons (id, league_id, season_number, status, created_at)
            VALUES (?,?,1,'ACTIVE',?)`,
      args: [seasonId, leagueId, now()],
    });

    const league = await db.execute({
      sql: `SELECT l.*, u.username as admin_username, u.display_name as admin_display_name
            FROM leagues l JOIN users u ON u.id = l.admin_id WHERE l.id = ?`,
      args: [leagueId],
    });

    return NextResponse.json({
      success: true,
      data: { ...league.rows[0], seasons: [{ id: seasonId, seasonNumber: 1, status: "ACTIVE" }] },
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
