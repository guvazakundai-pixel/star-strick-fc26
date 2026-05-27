import { db } from "@/lib/db";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RankingsClient } from "@/components/RankingsNew";

export const dynamic = "force-dynamic";
export const revalidate = 30;
export const metadata = {
  title: "Rankings · ZIM FCPRO",
  description: "Live global rankings for Zimbabwe's competitive EA Sports FC season.",
};

type RankingsPlayer = {
  id: string;
  rank: number;
  prev: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  country: string;
  city: string;
  points: number;
  finalScore: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  skillRating: number;
  winStreak: number;
  formHistory: string;
  mvpCount: number;
  rankChange: number;
};

async function getRankings(): Promise<RankingsPlayer[]> {
  try {
    const result = await db.execute({
      sql: `SELECT u.id, u.username, u.display_name, u.avatar_url, u.country, u.city,
                    ps.wins, ps.losses, ps.draws,
                    ps.goals_scored, ps.goals_conceded, ps.skill_rating,
                    ps.win_streak, ps.form_history, ps.mvp_count,
                    pr.rank_position, pr.prev_position, pr.rank_change,
                    pr.points AS ranking_points, pr.final_score
             FROM player_rankings pr
             JOIN users u ON u.id = pr.user_id
             LEFT JOIN player_stats ps ON ps.user_id = u.id
             WHERE (u.is_fake IS NULL OR u.is_fake = 0)
             ORDER BY pr.rank_position ASC
             LIMIT 100`,
      args: [],
    });

    return (result.rows as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      rank: r.rank_position as number,
      prev: (r.prev_position as number | null) ?? (r.rank_position as number),
      username: r.username as string,
      displayName: (r.display_name as string) || (r.username as string),
      avatarUrl: (r.avatar_url as string) || null,
      country: (r.country as string) || "Zimbabwe",
      city: (r.city as string) || "Harare",
      points: (r.ranking_points as number) || 0,
      finalScore: (r.final_score as number) || 0,
      wins: (r.wins as number) || 0,
      losses: (r.losses as number) || 0,
      draws: (r.draws as number) || 0,
      goalsFor: (r.goals_scored as number) || 0,
      goalsAgainst: (r.goals_conceded as number) || 0,
      skillRating: (r.skill_rating as number) || 1000,
      winStreak: (r.win_streak as number) || 0,
      formHistory: (r.form_history as string) || "",
      mvpCount: (r.mvp_count as number) || 0,
      rankChange: (r.rank_change as number) || 0,
    }));
  } catch (err) {
    console.error("[rankings page] Failed to fetch:", err);
    return [];
  }
}

export default async function RankingsPage() {
  const players = await getRankings();

  return (
    <ErrorBoundary scope="rankings">
      <RankingsClient livePlayers={players} />
    </ErrorBoundary>
  );
}