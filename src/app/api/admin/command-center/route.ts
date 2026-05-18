import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/route-auth";

type Row = Record<string, unknown>;

async function safeQuery(sql: string, args: unknown[] = []): Promise<Row[]> {
  try {
    const r = await db.execute({ sql, args });
    return r.rows as Row[];
  } catch { return []; }
}

async function safeExec(sql: string, args: unknown[] = []) {
  try { await db.execute({ sql, args }); return true; } catch { return false; }
}

export async function GET() {
  const auth = await requireRole("ADMIN", "MANAGER");
  if (!auth.ok) return auth.response;

  const start = Date.now();

  const [users, clubs, tournaments, leagues, matches, reports, audits, disputes] = await Promise.all([
    safeQuery("SELECT id, username, email, display_name AS displayName, role, platform, country, is_banned AS isBanned, is_verified AS isVerified, created_at AS createdAt FROM users ORDER BY created_at DESC LIMIT 50"),
    safeQuery("SELECT id, name, slug, tag, status, platform, is_verified AS isVerified, manager_id AS managerId, created_at AS createdAt FROM clubs ORDER BY created_at DESC LIMIT 50"),
    safeQuery("SELECT id, name, slug, status, type, max_players AS maxPlayers, platform, created_at AS createdAt FROM tournaments ORDER BY created_at DESC LIMIT 50"),
    safeQuery("SELECT id, name, slug, status, type, max_players AS maxPlayers, created_at AS createdAt FROM leagues ORDER BY created_at DESC LIMIT 50"),
    safeQuery("SELECT id, status, player1_id AS player1Id, player2_id AS player2Id, winner_id AS winnerId, score1, score2, created_at AS createdAt FROM match_reports ORDER BY created_at DESC LIMIT 50"),
    safeQuery("SELECT id, reporter_id AS reporterId, target_id AS targetId, target_type AS targetType, reason, status, created_at AS createdAt FROM reports ORDER BY created_at DESC LIMIT 20"),
    safeQuery("SELECT id, admin_id AS adminId, action, target, created_at AS createdAt FROM audit_logs ORDER BY created_at DESC LIMIT 20"),
    safeQuery("SELECT id, match_id AS matchId, reported_by AS reportedBy, reason, status, created_at AS createdAt FROM match_disputes ORDER BY created_at DESC LIMIT 20"),
  ]);

  const latency = Date.now() - start;

  return NextResponse.json({
    status: "healthy",
    latency,
    counts: {
      users: users.length,
      clubs: clubs.length,
      tournaments: tournaments.length,
      leagues: leagues.length,
      matches: matches.length,
      reports: reports.length,
      disputes: disputes.length,
    },
    users, clubs, tournaments, leagues, matches, reports, audits, disputes,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole("ADMIN", "MANAGER");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { action, id, data } = body;

  if (!action || !id) {
    return NextResponse.json({ error: "Missing action or id" }, { status: 400 });
  }

  let ok = false;

  switch (action) {
    case "banUser":
      ok = await safeExec("UPDATE users SET is_banned = ?, is_shadow_banned = ? WHERE id = ?", [data?.ban ? 1 : 0, data?.ban ? 1 : 0, id]);
      break;
    case "updateUserRole":
      ok = await safeExec("UPDATE users SET role = ? WHERE id = ?", [data?.role, id]);
      break;
    case "updateClubStatus":
      ok = await safeExec("UPDATE clubs SET status = ? WHERE id = ?", [data?.status, id]);
      break;
    case "updateTournamentStatus":
      ok = await safeExec("UPDATE tournaments SET status = ? WHERE id = ?", [data?.status, id]);
      break;
    case "updateLeagueStatus":
      ok = await safeExec("UPDATE leagues SET status = ? WHERE id = ?", [data?.status, id]);
      break;
    case "deleteUser":
      ok = await safeExec("DELETE FROM users WHERE id = ?", [id]);
      break;
    case "deleteClub":
      ok = await safeExec("DELETE FROM clubs WHERE id = ?", [id]);
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (!ok) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
