import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const results = await Promise.allSettled([
      db.execute({
        sql: `SELECT ua.id, ua.type, ua.message, ua.created_at,
                     u.username, u.display_name, u.avatar_url
              FROM user_activities ua
              JOIN users u ON u.id = ua.user_id
              ORDER BY ua.created_at DESC
              LIMIT 10`,
        args: [],
      }).catch(() => ({ rows: [] })),
      db.execute({
        sql: `SELECT ca.id, ca.type, ca.message, ca.created_at,
                     u.username, u.display_name, u.avatar_url
              FROM club_activities ca
              JOIN users u ON u.id = ca.user_id
              ORDER BY ca.created_at DESC
              LIMIT 10`,
        args: [],
      }).catch(() => ({ rows: [] })),
      db.execute({
        sql: `SELECT id, name, type, status, created_at, organizer_id
              FROM tournaments
              WHERE status IN ('LIVE', 'REGISTRATION')
              ORDER BY created_at DESC
              LIMIT 5`,
        args: [],
      }).catch(() => ({ rows: [] })),
    ]);

    const matchRows = results[0].status === "fulfilled" ? (results[0].value as any).rows ?? [] : [];
    const clubRows = results[1].status === "fulfilled" ? (results[1].value as any).rows ?? [] : [];
    const tournamentRows = results[2].status === "fulfilled" ? (results[2].value as any).rows ?? [] : [];

    const activities: any[] = [];

    for (const a of matchRows) {
      activities.push({
        id: a.id,
        type: a.type,
        message: a.message,
        username: a.display_name || a.username,
        avatarUrl: a.avatar_url,
        createdAt: a.created_at,
      });
    }

    for (const a of clubRows) {
      activities.push({
        id: `club_${a.id}`,
        type: a.type,
        message: a.message,
        username: a.display_name || a.username,
        avatarUrl: a.avatar_url,
        createdAt: a.created_at,
      });
    }

    for (const t of tournamentRows) {
      const organizerName = t.organizer_id
        ? (await db.execute({ sql: "SELECT username FROM users WHERE id = ? LIMIT 1", args: [t.organizer_id] }).catch(() => ({ rows: [] }))) as any
        : { rows: [] };
      activities.push({
        id: `tourn_${t.id}`,
        type: "TOURNAMENT",
        message: `${t.name} — ${t.status === "LIVE" ? "Now live" : "Registration open"}`,
        username: organizerName.rows?.[0]?.username ?? "ZIM FCPRO",
        avatarUrl: null,
        createdAt: t.created_at,
      });
    }

    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ activities: activities.slice(0, 20) });
  } catch {
    return NextResponse.json({ activities: [] });
  }
}
