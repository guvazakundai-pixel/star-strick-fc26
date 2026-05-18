import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

type Row = Record<string, unknown>;

function uuid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

async function q(sql: string, args: unknown[] = []) {
  const r = await db.execute({ sql, args });
  return r.rows as Row[];
}

async function q1(sql: string, args: unknown[] = []) {
  const rows = await q(sql, args);
  return rows[0] ?? null;
}

const ROLE_HIERARCHY = ["OWNER", "CO_OWNER", "GM", "COACH", "CAPTAIN", "ASST_CAPTAIN", "SCOUT", "MODERATOR", "PRO_PLAYER", "ACADEMY", "TRIAL", "CONTENT_CREATOR"];

function canManage(actorRole: string, targetRole: string): boolean {
  return ROLE_HIERARCHY.indexOf(actorRole) < ROLE_HIERARCHY.indexOf(targetRole);
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");

  if (clubId) {
    const club = await q1("SELECT * FROM clubs WHERE id = ?", [clubId]);
    if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

    const members = await q(
      `SELECT cm.*, u.username, u.display_name AS displayName, u.avatar_url AS avatarUrl, u.platform
       FROM club_members cm JOIN users u ON u.id = cm.user_id WHERE cm.club_id = ? ORDER BY
       CASE cm.role WHEN 'OWNER' THEN 0 WHEN 'CO_OWNER' THEN 1 WHEN 'GM' THEN 2 WHEN 'COACH' THEN 3 WHEN 'CAPTAIN' THEN 4 WHEN 'ASST_CAPTAIN' THEN 5 ELSE 6 END, cm.joined_at ASC`,
      [clubId]
    );

    const applications = await q(
      `SELECT ca.*, u.username, u.display_name AS displayName, u.avatar_url AS avatarUrl FROM club_applications ca JOIN users u ON u.id = ca.user_id WHERE ca.club_id = ? AND ca.status = 'PENDING' ORDER BY ca.created_at DESC`,
      [clubId]
    );

    const stats = await q1(
      `SELECT count(*) as total_members, sum(CASE WHEN cm.status='ACTIVE' THEN 1 ELSE 0 END) as active_members,
        (SELECT count(*) FROM club_matches WHERE (club1_id=? OR club2_id=?) AND status='COMPLETED') as total_matches,
        (SELECT count(*) FROM club_rivalries WHERE club1_id=? OR club2_id=?) as rivalries
       FROM club_members cm WHERE cm.club_id=?`,
      [clubId, clubId, clubId, clubId, clubId]
    );

    return NextResponse.json({ club, members, applications, stats });
  }

  const clubs = await q("SELECT * FROM clubs ORDER BY created_at DESC");
  return NextResponse.json({ clubs });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { clubId, action, data } = await req.json();
  if (!clubId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const member = await q1("SELECT * FROM club_members WHERE club_id=? AND user_id=?", [clubId, auth.session.userId]);
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const role = member.role as string;
  if (!["OWNER", "CO_OWNER", "GM", "CAPTAIN"].includes(role) && action !== "leave") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    switch (action) {
      case "update": {
        await db.execute({
          sql: "UPDATE clubs SET name=COALESCE(?,name), tag=COALESCE(?,tag), description=COALESCE(?,description), logo_url=COALESCE(?,logo_url), banner_url=COALESCE(?,banner_url), city=COALESCE(?,city), country=COALESCE(?,country), recruitment_status=COALESCE(?,recruitment_status), is_public=COALESCE(?,is_public), social_links=COALESCE(?,social_links), updated_at=? WHERE id=?",
          args: [data.name, data.tag, data.description, data.logoUrl, data.bannerUrl, data.city, data.country, data.recruitmentStatus, data.isPublic, data.socialLinks, now(), clubId],
        });
        break;
      }
      case "promote":
      case "demote": {
        const target = await q1("SELECT * FROM club_members WHERE club_id=? AND user_id=?", [clubId, data.targetId]);
        if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
        if (!canManage(role, target.role as string)) return NextResponse.json({ error: "Cannot manage this member" }, { status: 403 });

        const idx = ROLE_HIERARCHY.indexOf(target.role as string);
        const newIdx = action === "promote" ? Math.max(0, idx - 1) : Math.min(ROLE_HIERARCHY.length - 1, idx + 1);
        const newRole = ROLE_HIERARCHY[newIdx];
        if (newRole === "OWNER") return NextResponse.json({ error: "Cannot assign owner" }, { status: 400 });

        await db.execute({ sql: "UPDATE club_members SET role=? WHERE club_id=? AND user_id=?", args: [newRole, clubId, data.targetId] });
        break;
      }
      case "kick":
      case "ban": {
        if (!canManage(role, (await q1("SELECT role FROM club_members WHERE club_id=? AND user_id=?", [clubId, data.targetId]))?.role as string)) {
          return NextResponse.json({ error: "Cannot manage this member" }, { status: 403 });
        }
        await db.execute({ sql: "UPDATE club_members SET status=? WHERE club_id=? AND user_id=?", args: [action === "ban" ? "BANNED" : "REMOVED", clubId, data.targetId] });
        if (action === "ban") {
          await q(`INSERT INTO club_moderation_logs (id, club_id, action, target_id, moderator_id, reason, created_at) VALUES (?,?,?,?,?,?,?)`,
            [uuid(), clubId, "BAN", data.targetId, auth.session.userId, data.reason || "", now()]
          );
        }
        break;
      }
      case "leave": {
        await db.execute({ sql: "DELETE FROM club_members WHERE club_id=? AND user_id=?", args: [clubId, auth.session.userId] });
        break;
      }
      case "approve": {
        const app = await q1("SELECT * FROM club_applications WHERE id=?", [data.applicationId]);
        if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
        const newId = uuid();
        await db.execute({
          sql: "INSERT OR IGNORE INTO club_members (id, club_id, user_id, role, joined_at, status) VALUES (?,?,?,?,?,?)",
          args: [newId, clubId, app.user_id, data.role || "TRIAL", now(), "ACTIVE"],
        });
        await db.execute({ sql: "UPDATE club_applications SET status='ACCEPTED', reviewed_by=?, reviewed_at=? WHERE id=?", args: [auth.session.userId, now(), data.applicationId] });
        break;
      }
      case "reject": {
        await db.execute({ sql: "UPDATE club_applications SET status='REJECTED', reviewed_by=?, reviewed_at=? WHERE id=?", args: [auth.session.userId, now(), data.applicationId] });
        break;
      }
      case "invite": {
        await q(`INSERT OR IGNORE INTO club_invites (id, club_id, sender_id, invitee_id, message, created_at) VALUES (?,?,?,?,?,?)`,
          [uuid(), clubId, auth.session.userId, data.inviteeId, data.message || "", now()]
        );
        break;
      }
      case "cancelInvite": {
        await db.execute({ sql: "UPDATE club_invites SET status='CANCELLED' WHERE id=?", args: [data.inviteId] });
        break;
      }
      case "setPermissions": {
        if (role !== "OWNER") return NextResponse.json({ error: "Only owner can set permissions" }, { status: 403 });
        await db.execute({ sql: "UPDATE club_members SET permissions=? WHERE club_id=? AND user_id=?", args: [JSON.stringify(data.permissions), clubId, data.targetId] });
        break;
      }
      case "archive": {
        if (role !== "OWNER") return NextResponse.json({ error: "Only owner can archive" }, { status: 403 });
        await db.execute({ sql: "UPDATE club_members SET status='ARCHIVED' WHERE club_id=? AND user_id=?", args: [clubId, data.targetId] });
        break;
      }
      case "announce": {
        await q(`INSERT INTO club_announcements (id, club_id, author_id, title, content, pinned, created_at) VALUES (?,?,?,?,?,?,?)`,
          [uuid(), clubId, auth.session.userId, data.title, data.content, data.pinned ? 1 : 0, now()]
        );
        break;
      }
      case "transferOwner": {
        if (role !== "OWNER") return NextResponse.json({ error: "Only owner" }, { status: 403 });
        await db.execute({ sql: "UPDATE club_members SET role='OWNER' WHERE club_id=? AND user_id=?", args: [clubId, data.newOwnerId] });
        await db.execute({ sql: "UPDATE club_members SET role='CO_OWNER' WHERE club_id=? AND user_id=?", args: [clubId, auth.session.userId] });
        await db.execute({ sql: "UPDATE clubs SET manager_id=? WHERE id=?", args: [data.newOwnerId, clubId] });
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
