import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const search = searchParams.get("q") ?? "";
  const offset = (page - 1) * limit;

  let searchClause = "";
  const args: any[] = [];
  if (search) {
    const like = `%${search}%`;
    args.push(like, like, like);
    searchClause = `WHERE (c.name LIKE ? OR c.tag LIKE ? OR c.tagline LIKE ?)`;
  }

  const clubsRes = await db.execute({
    sql: `
      SELECT
        c.id, c.name, c.slug, c.tag, c.tagline, c.logo_url, c.city, c.country,
        c.is_verified, c.members_invite_only, c.club_xp, c.win_rate,
        c.featured_legends, c.join_code, c.is_public, c.description,
        g.rank_position, g.total_points, g.wins, g.losses, g.draws,
        g.played, g.goals_for, g.goals_against, g.momentum,
        m.username as manager_username, m.display_name as manager_display_name,
        (SELECT count(*) FROM club_members cm WHERE cm.club_id = c.id AND cm.status = 'APPROVED') as member_count,
        (SELECT count(*) FROM club_achievements ca WHERE ca.club_id = c.id) as achievement_count
      FROM clubs c
      LEFT JOIN global_club_rankings g ON g.club_id = c.id
      LEFT JOIN users m ON m.id = c.manager_id
      ${searchClause}
      ORDER BY g.rank_position ASC NULLS LAST, c.name ASC
      LIMIT ? OFFSET ?
    `,
    args: [...args, limit, offset],
  });

  const totalRes = await db.execute({
    sql: `SELECT count(*) as cnt FROM clubs c ${searchClause}`,
    args,
  });

  const clubs = clubsRes.rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    tag: r.tag,
    tagline: r.tagline,
    logoUrl: r.logo_url,
    city: r.city,
    country: r.country,
    description: r.description,
    isVerified: !!r.is_verified,
    membersInviteOnly: !!r.members_invite_only,
    isPublic: !!r.is_public,
    joinCode: r.join_code,
    clubXp: Number(r.club_xp) || 0,
    winRate: Number(r.win_rate) || 0,
    memberCount: Number(r.member_count) || 0,
    achievementCount: Number(r.achievement_count) || 0,
    featuredLegends: r.featured_legends ? JSON.parse(r.featured_legends) : [],
    globalRank: r.rank_position
      ? {
          rankPosition: Number(r.rank_position),
          totalPoints: Number(r.total_points),
          wins: Number(r.wins) || 0,
          losses: Number(r.losses) || 0,
          draws: Number(r.draws) || 0,
          played: Number(r.played) || 0,
          goalsFor: Number(r.goals_for) || 0,
          goalsAgainst: Number(r.goals_against) || 0,
          momentum: Number(r.momentum) || 50,
        }
      : null,
    manager: { username: r.manager_username, displayName: r.manager_display_name },
  }));

  return NextResponse.json({
    clubs,
    total: Number(totalRes.rows[0].cnt),
    page,
    totalPages: Math.ceil(Number(totalRes.rows[0].cnt) / limit),
  });
}
