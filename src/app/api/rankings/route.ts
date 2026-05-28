import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));
  const search = searchParams.get("search") || "";
  const city = searchParams.get("city") || "";
  const includeFake = searchParams.get("includeFake") === "true";

  try {
    const conditions: string[] = [];
    const args: unknown[] = [];

    if (!includeFake) {
      conditions.push("(u.is_fake IS NULL OR u.is_fake = 0)");
    }
    if (search) {
      conditions.push("(u.username LIKE ? OR u.display_name LIKE ?)");
      args.push(`%${search}%`, `%${search}%`);
    }
    if (city) {
      conditions.push("u.city = ?");
      args.push(city);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await db.execute({
      sql: `SELECT count(*) as c FROM player_rankings pr JOIN users u ON u.id = pr.user_id ${whereClause}`,
      args,
    });
    const total = Number((countResult.rows[0] as Record<string, unknown>)?.c ?? 0);

    const dataResult = await db.execute({
      sql: `SELECT u.id, u.username, u.display_name, u.avatar_url, u.country, u.city,
                   u.is_verified,
                   ps.matches_played, ps.wins, ps.losses, ps.draws,
                   ps.goals_scored, ps.goals_conceded, ps.skill_rating, ps.points,
                   ps.form_score, ps.win_streak, ps.mvp_count, ps.form_history,
                   pr.rank_position, pr.rank_change, pr.points as ranking_points, pr.final_score,
                   ft.team_name
            FROM player_rankings pr
            JOIN users u ON u.id = pr.user_id
            LEFT JOIN player_stats ps ON ps.user_id = u.id
            LEFT JOIN fantasy_teams ft ON ft.user_id = u.id
            ${whereClause}
            ORDER BY pr.rank_position ASC
            LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

    const rankings = (dataResult.rows as Record<string, unknown>[]).map((r) => ({
      id: r.id,
      username: r.username,
      displayName: r.display_name ?? r.username,
      avatarUrl: r.avatar_url,
      country: r.country,
      city: r.city,
      isVerified: !!r.is_verified,
      rank: r.rank_position,
      rankChange: r.rank_change ?? 0,
      points: r.ranking_points,
      finalScore: r.final_score,
      skillRating: r.skill_rating ?? 1000,
      teamName: r.team_name ?? `${r.username} FC`,
      stats: {
        matchesPlayed: r.matches_played ?? 0,
        wins: r.wins ?? 0,
        losses: r.losses ?? 0,
        draws: r.draws ?? 0,
        goalsScored: r.goals_scored ?? 0,
        goalsConceded: r.goals_conceded ?? 0,
        points: r.points ?? 0,
        formScore: r.form_score ?? 0,
        winStreak: r.win_streak ?? 0,
        mvpCount: r.mvp_count ?? 0,
        formHistory: r.form_history ?? "",
      },
    }));

    return NextResponse.json({ success: true, data: rankings, total, limit, offset });
  } catch (e) {
    console.error("[rankings]", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rankings", data: [], total: 0 },
      { status: 500 },
    );
  }
}