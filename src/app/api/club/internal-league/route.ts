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
  if (!clubId) return NextResponse.json({ error: "clubId required" }, { status: 400 });

  const leagues = await q("SELECT * FROM club_internal_leagues WHERE club_id=? ORDER BY created_at DESC", [clubId]);
  return NextResponse.json({ leagues });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { action, data } = await req.json();

  const member = await q1("SELECT role FROM club_members WHERE club_id=? AND user_id=?", [data.clubId, auth.session.userId]);
  if (!member || !["OWNER", "CO_OWNER", "GM"].includes(member.role as string))
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  switch (action) {
    case "create": {
      await q("INSERT INTO club_internal_leagues (id, club_id, name, status, season_duration, max_players, points_system, has_promotion, has_relegation, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [uuid(), data.clubId, data.name, "DRAFT", data.seasonDuration || 30, data.maxPlayers || 20, data.pointsSystem || "3-1-0", data.hasPromotion ? 1 : 0, data.hasRelegation ? 1 : 0, now()]
      );
      return NextResponse.json({ success: true });
    }
    case "start": {
      await db.execute({ sql: "UPDATE club_internal_leagues SET status='ACTIVE', started_at=? WHERE id=?", args: [now(), data.leagueId] });
      return NextResponse.json({ success: true });
    }
    case "end": {
      await db.execute({ sql: "UPDATE club_internal_leagues SET status='ENDED', ended_at=? WHERE id=?", args: [now(), data.leagueId] });
      return NextResponse.json({ success: true });
    }
    case "pause":
    case "resume": {
      const s = action === "pause" ? "PAUSED" : "ACTIVE";
      await db.execute({ sql: "UPDATE club_internal_leagues SET status=? WHERE id=?", args: [s, data.leagueId] });
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
