import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ users: [] });

  try {
    const result = await db.execute({
      sql: `SELECT u.id, u.username, u.display_name, u.avatar_url, u.platform,
                   pr.rank_position, pr.points
            FROM users u
            LEFT JOIN player_rankings pr ON pr.user_id = u.id
            WHERE (u.username LIKE ? OR u.display_name LIKE ?)
              AND u.role = 'PLAYER'
            ORDER BY pr.rank_position ASC NULLS LAST
            LIMIT 10`,
      args: [`%${q}%`, `%${q}%`],
    });

    const users = (result.rows as any[]).map((r) => ({
      id: r.id,
      username: r.username,
      displayName: r.display_name ?? r.username,
      avatarUrl: r.avatar_url,
      platform: r.platform,
      rank: r.rank_position ?? null,
      points: r.points ?? 0,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[UserSearch] Failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
