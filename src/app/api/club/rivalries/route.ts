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

  if (clubId) {
    const rivalries = await q(
      `SELECT cr.*, c1.name AS club1_name, c1.slug AS club1_slug, c1.logo_url AS club1_logo,
        c2.name AS club2_name, c2.slug AS club2_slug, c2.logo_url AS club2_logo
       FROM club_rivalries cr
       JOIN clubs c1 ON c1.id = cr.club1_id
       JOIN clubs c2 ON c2.id = cr.club2_id
       WHERE cr.club1_id=? OR cr.club2_id=?
       ORDER BY cr.rivalry_score DESC`,
      [clubId, clubId]
    );
    return NextResponse.json({ rivalries });
  }

  const all = await q(
    `SELECT cr.*, c1.name AS club1_name, c2.name AS club2_name
     FROM club_rivalries cr JOIN clubs c1 ON c1.id = cr.club1_id JOIN clubs c2 ON c2.id = cr.club2_id
     ORDER BY cr.rivalry_score DESC LIMIT 50`
  );
  return NextResponse.json({ rivalries: all });
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
    case "declare": {
      await q("INSERT OR IGNORE INTO club_rivalries (id, club1_id, club2_id, club1_wins, club2_wins, rivalry_score, created_at, updated_at) VALUES (?,?,?,0,0,1,?,?)",
        [uuid(), data.clubId, data.rivalClubId, now(), now()]
      );
      return NextResponse.json({ success: true });
    }
    case "remove": {
      await db.execute({ sql: "DELETE FROM club_rivalries WHERE id=?", args: [data.rivalryId] });
      return NextResponse.json({ success: true });
    }
    case "feature": {
      await db.execute({ sql: "UPDATE club_rivalries SET featured=1 WHERE id=?", args: [data.rivalryId] });
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
