import { db } from "@/lib/db";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HomeClient } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

type FeaturedPlayer = {
  id: string;
  username: string;
  displayName: string | null;
  rankPosition: number;
  points: number;
  skillRating: number;
  winStreak: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  formHistory: string | null;
  clubName: string | null;
  clubTag: string | null;
};

export default async function HomePage() {
  let totalMatches = 0;
  let totalGoals = 0;
  let playerCount = 0;
  let clubCount = 0;

  try {
    const [matchesRes, goalsRes, playersRes, clubsRes] = await Promise.all([
      db.execute("SELECT COALESCE(SUM(matches_played),0) as v FROM player_stats"),
      db.execute("SELECT COALESCE(SUM(goals_scored),0) as v FROM player_stats"),
      db.execute("SELECT count(*) as v FROM player_stats"),
      db.execute("SELECT count(*) as v FROM clubs"),
    ]);
    totalMatches = Number(matchesRes.rows[0].v);
    totalGoals = Number(goalsRes.rows[0].v);
    playerCount = Number(playersRes.rows[0].v);
    clubCount = Number(clubsRes.rows[0].v);
  } catch {}

  let featuredPlayers: FeaturedPlayer[] = [];

  try {
    const res = await db.execute(`
      SELECT
        u.id, u.username, u.display_name,
        pr.rank_position, pr.points,
        ps.skill_rating, ps.win_streak,
        ps.matches_played, ps.wins, ps.losses,
        ps.goals_scored, ps.goals_conceded,
        ps.form_history,
        c.name as club_name, c.tag as club_tag
      FROM player_rankings pr
      JOIN users u ON u.id = pr.user_id
      LEFT JOIN player_stats ps ON ps.user_id = u.id
      LEFT JOIN clubs c ON c.id = u.club_id
      ORDER BY pr.rank_position ASC
      LIMIT 9
    `);
    featuredPlayers = res.rows as unknown as FeaturedPlayer[];
  } catch {}

  return (
    <ErrorBoundary>
      <HomeClient
        totalMatches={totalMatches}
        totalGoals={totalGoals}
        playerCount={playerCount}
        clubCount={clubCount}
        featuredPlayers={featuredPlayers}
      />
    </ErrorBoundary>
  );
}