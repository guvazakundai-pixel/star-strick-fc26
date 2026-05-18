import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

type Row = Record<string, unknown>;
async function q(sql: string, args: unknown[] = []) { const r = await db.execute({ sql, args }); return r.rows as Row[]; }
async function q1(sql: string, args: unknown[] = []) { const rows = await q(sql, args); return rows[0] ?? null; }

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");

  if (!clubId) return NextResponse.json({ error: "clubId required" }, { status: 400 });

  const [memberCount, matchStats, seasonInfo, appCount, trainingCount] = await Promise.all([
    q1("SELECT count(*) as total, sum(CASE WHEN status='ACTIVE' THEN 1 ELSE 0 END) as active FROM club_members WHERE club_id=?", [clubId]),
    q1("SELECT count(*) as total, sum(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) as completed FROM club_matches WHERE club1_id=? OR club2_id=?", [clubId, clubId]),
    q1("SELECT count(*) as seasons FROM club_seasons WHERE club_id=?", [clubId]),
    q1("SELECT count(*) as pending FROM club_applications WHERE club_id=? AND status='PENDING'", [clubId]),
    q1("SELECT count(*) as sessions FROM club_training_sessions WHERE club_id=? AND status IN ('SCHEDULED','COMPLETED')", [clubId]),
  ]);

  return NextResponse.json({
    members: memberCount,
    matches: matchStats,
    seasons: seasonInfo?.seasons ?? 0,
    pendingApplications: appCount?.pending ?? 0,
    trainingSessions: trainingCount?.sessions ?? 0,
  });
}
