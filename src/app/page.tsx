import { db } from "@/lib/db";
import { Suspense } from "react";
import { ErrorBoundary, ScopedErrorBoundary } from "@/components/ErrorBoundary";
import { HomeClient } from "@/components/HomeClient";
import { HeroSkeleton } from "@/components/ui/Skeleton";

export const revalidate = 30;

function safeNumber(val: unknown, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

async function getSiteStats(): Promise<{
  totalMatches: number;
  totalGoals: number;
  playerCount: number;
  clubCount: number;
}> {
  try {
    const res = await db.execute(
      "SELECT COALESCE(SUM(matches_played),0) as total_matches, COALESCE(SUM(goals_scored),0) as total_goals, count(*) as player_count, (SELECT count(*) FROM clubs) as club_count FROM player_stats"
    ).catch(() => ({ rows: [{ total_matches: 0, total_goals: 0, player_count: 0, club_count: 0 }] }));
    const row = res.rows[0] ?? { total_matches: 0, total_goals: 0, player_count: 0, club_count: 0 };
    return {
      totalMatches: safeNumber(row.total_matches, 0),
      totalGoals: safeNumber(row.total_goals, 0),
      playerCount: safeNumber(row.player_count, 0),
      clubCount: safeNumber(row.club_count, 0),
    };
  } catch (err) {
    console.error("[HomePage] getSiteStats failed:", err);
    return { totalMatches: 0, totalGoals: 0, playerCount: 0, clubCount: 0 };
  }
}

export default async function HomePage() {
  const stats = await getSiteStats();

  return (
    <ErrorBoundary scope="homepage">
      <Suspense fallback={<HeroSkeleton />}>
        <HomeClient
          totalMatches={stats.totalMatches}
          totalGoals={stats.totalGoals}
          playerCount={stats.playerCount}
          clubCount={stats.clubCount}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
