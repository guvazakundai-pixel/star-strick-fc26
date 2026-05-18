import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

type Row = Record<string, unknown>;
function uuid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }
async function q(sql: string, args: unknown[] = []) { const r = await db.execute({ sql, args }); return r.rows as Row[]; }
async function q1(sql: string, args: unknown[] = []) { const rows = await q(sql, args); return rows[0] ?? null; }

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");

  const seasons = await q(
    "SELECT * FROM club_seasons WHERE club_id=? ORDER BY season_number DESC",
    [clubId || ""]
  );
  return NextResponse.json({ seasons });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { action, data } = await req.json();

  const member = await q1("SELECT role FROM club_members WHERE club_id=? AND user_id=?", [data.clubId, auth.session.userId]);
  if (!member || !["OWNER", "CO_OWNER", "GM"].includes(member.role as string)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  switch (action) {
    case "create": {
      const max = await q1("SELECT COALESCE(MAX(season_number),0) AS n FROM club_seasons WHERE club_id=?", [data.clubId]);
      const num = (max?.n as number ?? 0) + 1;
      await q("INSERT INTO club_seasons (id, club_id, season_number, name, status, started_at, created_at) VALUES (?,?,?,?,?,?,?)",
        [uuid(), data.clubId, num, data.name || `Season ${num}`, "ACTIVE", now(), now()]
      );
      return NextResponse.json({ success: true, seasonNumber: num });
    }
    case "end": {
      const season = await q1("SELECT * FROM club_seasons WHERE id=?", [data.seasonId]);
      if (!season) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await db.execute({
        sql: "UPDATE club_seasons SET status='ENDED', ended_at=?, mvp_id=?, records=? WHERE id=?",
        args: [now(), data.mvpId || null, JSON.stringify(data.records || {}), data.seasonId],
      });
      await q("INSERT INTO club_seasons (id, club_id, season_number, name, status, started_at, created_at) VALUES (?,?,?,?,?,?,?)",
        [uuid(), data.clubId, (season.season_number as number) + 1, data.nextName || `Season ${(season.season_number as number) + 1}`, "ACTIVE", now(), now()]
      );
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
