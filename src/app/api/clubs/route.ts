import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const search = searchParams.get("q") ?? "";
  const offset = (page - 1) * limit;

  const searchClause = search
    ? `WHERE (c.name LIKE '%${search.replace(/'/g, "''")}%' OR c.tag LIKE '%${search.replace(/'/g, "''")}%')`
    : "";

  const clubsRes = await db.execute(`
    SELECT
      c.id, c.name, c.slug, c.tag, c.logo_url, c.city, c.country,
      c.is_verified, c.members_invite_only,
      g.rank_position, g.total_points,
      m.username as manager_username, m.display_name as manager_display_name,
      (SELECT count(*) FROM club_members cm WHERE cm.club_id = c.id AND cm.status = 'APPROVED') as member_count
    FROM clubs c
    LEFT JOIN global_club_rankings g ON g.club_id = c.id
    LEFT JOIN users m ON m.id = c.manager_id
    ${searchClause}
    ORDER BY c.name ASC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const totalRes = await db.execute(`SELECT count(*) as cnt FROM clubs c ${searchClause}`);

  const clubs = clubsRes.rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    tag: r.tag,
    logoUrl: r.logo_url,
    city: r.city,
    country: r.country,
    isVerified: !!r.is_verified,
    membersInviteOnly: !!r.members_invite_only,
    memberCount: Number(r.member_count),
    globalRank: r.rank_position ? { rankPosition: Number(r.rank_position), totalPoints: Number(r.total_points) } : null,
    manager: { username: r.manager_username, displayName: r.manager_display_name },
  }));

  return NextResponse.json({
    clubs,
    total: Number(totalRes.rows[0].cnt),
    page,
    totalPages: Math.ceil(Number(totalRes.rows[0].cnt) / limit),
  });
}