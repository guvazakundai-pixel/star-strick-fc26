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
  const t = await q("SELECT * FROM club_tournaments WHERE club_id=? ORDER BY created_at DESC", [clubId]);
  return NextResponse.json({ tournaments: t });
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
      await q("INSERT INTO club_tournaments (id, club_id, name, format, status, max_participants, created_at) VALUES (?,?,?,?,?,?,?)",
        [uuid(), data.clubId, data.name, data.format || "KNOCKOUT", "DRAFT", data.maxParticipants || 16, now()]
      );
      return NextResponse.json({ success: true });
    }
    case "start": {
      await db.execute({ sql: "UPDATE club_tournaments SET status='ACTIVE' WHERE id=?", args: [data.tournamentId] });
      return NextResponse.json({ success: true });
    }
    case "complete": {
      await db.execute({ sql: "UPDATE club_tournaments SET status='COMPLETED', winner_id=?, mvp_id=? WHERE id=?",
        args: [data.winnerId || null, data.mvpId || null, data.tournamentId]
      });
      return NextResponse.json({ success: true });
    }
    case "seed": {
      await db.execute({ sql: "UPDATE club_tournaments SET bracket=? WHERE id=?", args: [JSON.stringify(data.bracket), data.tournamentId] });
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
