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
  const type = searchParams.get("type");

  if (type === "free-agents") {
    const agents = await q(
      `SELECT fa.*, u.username, u.display_name AS displayName, u.avatar_url AS avatarUrl, u.platform, u.country,
        ps.wins, ps.losses, ps.skill_rating AS skillRating
       FROM free_agents fa JOIN users u ON u.id = fa.user_id
       LEFT JOIN player_stats ps ON ps.user_id = fa.user_id
       WHERE fa.status = 'ACTIVE' ORDER BY fa.created_at DESC`
    );
    return NextResponse.json({ agents });
  }

  if (type === "tryouts") {
    const clubId = searchParams.get("clubId");
    if (!clubId) return NextResponse.json({ error: "clubId required" }, { status: 400 });
    const tryouts = await q("SELECT * FROM club_tournaments WHERE club_id=? AND format='TRYOUT' ORDER BY created_at DESC", [clubId]);
    return NextResponse.json({ tryouts });
  }

  const userId = searchParams.get("userId");
  if (userId) {
    const apps = await q(
      `SELECT ca.*, c.name AS clubName, c.slug AS clubSlug, c.logo_url AS clubLogo
       FROM club_applications ca JOIN clubs c ON c.id = ca.club_id WHERE ca.user_id=? ORDER BY ca.created_at DESC`,
      [userId]
    );
    const invites = await q(
      `SELECT ci.*, c.name AS clubName, c.slug AS clubSlug FROM club_invites ci JOIN clubs c ON c.id = ci.club_id WHERE ci.invitee_id=? AND ci.status='PENDING'`,
      [userId]
    );
    return NextResponse.json({ applications: apps, invites });
  }

  return NextResponse.json({ error: "Missing params" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { action, data } = await req.json();

  switch (action) {
    case "apply": {
      await q("INSERT OR IGNORE INTO club_applications (id, club_id, user_id, message, preferred_role, created_at) VALUES (?,?,?,?,?,?)",
        [uuid(), data.clubId, auth.session.userId, data.message || "", data.preferredRole || "", now()]
      );
      return NextResponse.json({ success: true });
    }
    case "free-agent": {
      await q("INSERT OR REPLACE INTO free_agents (id, user_id, status, preferred_role, preferred_playstyle, description, availability, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
        [uuid(), auth.session.userId, "ACTIVE", data.preferredRole, data.playstyle, data.description, data.availability, now(), now()]
      );
      return NextResponse.json({ success: true });
    }
    case "remove-free-agent": {
      await db.execute({ sql: "DELETE FROM free_agents WHERE user_id=?", args: [auth.session.userId] });
      return NextResponse.json({ success: true });
    }
    case "respond-invite": {
      if (data.accept) {
        const invite = await q1("SELECT * FROM club_invites WHERE id=?", [data.inviteId]);
        if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        await q("INSERT OR IGNORE INTO club_members (id, club_id, user_id, role, joined_at, status) VALUES (?,?,?,?,?,?)",
          [uuid(), invite.club_id, auth.session.userId, "TRIAL", now(), "ACTIVE"]
        );
      }
      await db.execute({ sql: "UPDATE club_invites SET status=? WHERE id=?", args: [data.accept ? "ACCEPTED" : "DECLINED", data.inviteId] });
      return NextResponse.json({ success: true });
    }
    case "withdraw-application": {
      await db.execute({ sql: "DELETE FROM club_applications WHERE id=? AND user_id=?", args: [data.applicationId, auth.session.userId] });
      return NextResponse.json({ success: true });
    }
    case "create-tryout": {
      const member = await q1("SELECT role FROM club_members WHERE club_id=? AND user_id=?", [data.clubId, auth.session.userId]);
      if (!member || !["OWNER", "CO_OWNER", "GM", "CAPTAIN"].includes(member.role as string)) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
      await q("INSERT INTO club_tournaments (id, club_id, name, format, status, max_participants, created_at) VALUES (?,?,?,?,?,?,?)",
        [uuid(), data.clubId, data.name || "Tryouts", "TRYOUT", "REGISTRATION", data.maxParticipants || 32, now()]
      );
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
