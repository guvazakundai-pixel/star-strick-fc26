import { db } from "@/lib/db";
import { Suspense } from "react";
import { ErrorBoundary, ScopedErrorBoundary } from "@/components/ErrorBoundary";
import { HomeClient } from "@/components/HomeClient";
import { HeroSkeleton } from "@/components/ui/Skeleton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function safeNumber(val: unknown, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function safeString(val: unknown, fallback: string = ""): string {
  if (val === null || val === undefined) return fallback;
  return String(val || fallback);
}

async function getSiteStats(): Promise<{
  totalMatches: number;
  totalGoals: number;
  playerCount: number;
  clubCount: number;
}> {
  try {
    const [matchesRes, goalsRes, playersRes, clubsRes] = await Promise.all([
      db.execute("SELECT COALESCE(SUM(matches_played),0) as v FROM player_stats").catch(() => ({ rows: [{ v: 0 }] })),
      db.execute("SELECT COALESCE(SUM(goals_scored),0) as v FROM player_stats").catch(() => ({ rows: [{ v: 0 }] })),
      db.execute("SELECT count(*) as v FROM player_stats").catch(() => ({ rows: [{ v: 0 }] })),
      db.execute("SELECT count(*) as v FROM clubs").catch(() => ({ rows: [{ v: 0 }] })),
    ]);

    return {
      totalMatches: safeNumber(matchesRes?.rows?.[0]?.v, 0),
      totalGoals: safeNumber(goalsRes?.rows?.[0]?.v, 0),
      playerCount: safeNumber(playersRes?.rows?.[0]?.v, 0),
      clubCount: safeNumber(clubsRes?.rows?.[0]?.v, 0),
    };
  } catch (err) {
    console.error("[HomePage] getSiteStats failed:", err);
    return { totalMatches: 0, totalGoals: 0, playerCount: 0, clubCount: 0 };
  }
}

async function getFeaturedPlayers(): Promise<FeaturedPlayer[]> {
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

    if (!res?.rows || !Array.isArray(res.rows)) return [];

    return res.rows.map((row: Record<string, unknown>) => ({
      id: safeString(row.id),
      username: safeString(row.username, "unknown"),
      displayName: typeof row.display_name === "string" ? row.display_name : null,
      rankPosition: safeNumber(row.rank_position, 999),
      points: safeNumber(row.points, 0),
      skillRating: safeNumber(row.skill_rating, 1000),
      winStreak: safeNumber(row.win_streak, 0),
      matchesPlayed: safeNumber(row.matches_played, 0),
      wins: safeNumber(row.wins, 0),
      losses: safeNumber(row.losses, 0),
      goalsScored: safeNumber(row.goals_scored, 0),
      goalsConceded: safeNumber(row.goals_conceded, 0),
      formHistory: typeof row.form_history === "string" ? row.form_history : null,
      clubName: typeof row.club_name === "string" ? row.club_name : null,
      clubTag: typeof row.club_tag === "string" ? row.club_tag : null,
    }));
  } catch (err) {
    console.error("[HomePage] getFeaturedPlayers failed:", err);
    return [];
  }
}

export default async function HomePage() {
  const [stats, featuredPlayers] = await Promise.all([
    getSiteStats(),
    getFeaturedPlayers(),
  ]);

  return (
    <ErrorBoundary scope="homepage">
      <Suspense fallback={<HeroSkeleton />}>
        <HomeClient
          totalMatches={stats.totalMatches}
          totalGoals={stats.totalGoals}
          playerCount={stats.playerCount}
          clubCount={stats.clubCount}
          featuredPlayers={featuredPlayers}
        />
      </Suspense>
    </ErrorBoundary>
  );
}