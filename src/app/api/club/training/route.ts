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

  const [sessions, announcements] = await Promise.all([
    q("SELECT * FROM club_training_sessions WHERE club_id=? ORDER BY scheduled_at ASC", [clubId]),
    q("SELECT ca.*, u.username FROM club_announcements ca JOIN users u ON u.id=ca.author_id WHERE ca.club_id=? ORDER BY ca.pinned DESC, ca.created_at DESC", [clubId]),
  ]);
  return NextResponse.json({ sessions, announcements });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { action, data } = await req.json();

  const member = await q1("SELECT role FROM club_members WHERE club_id=? AND user_id=?", [data.clubId, auth.session.userId]);
  const canManage = member && ["OWNER", "CO_OWNER", "GM", "COACH", "CAPTAIN"].includes(member.role as string);
  if (!canManage) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  switch (action) {
    case "create-training": {
      await q("INSERT INTO club_training_sessions (id, club_id, title, type, scheduled_at, duration, created_by, status, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
        [uuid(), data.clubId, data.title, data.type || "TRAINING", data.scheduledAt, data.duration || 60, auth.session.userId, "SCHEDULED", now()]
      );
      return NextResponse.json({ success: true });
    }
    case "cancel-training": {
      await db.execute({ sql: "UPDATE club_training_sessions SET status='CANCELLED' WHERE id=?", args: [data.sessionId] });
      return NextResponse.json({ success: true });
    }
    case "complete-training": {
      await db.execute({ sql: "UPDATE club_training_sessions SET status='COMPLETED' WHERE id=?", args: [data.sessionId] });
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
