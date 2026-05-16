import { db } from "@/lib/db";
import { Suspense } from "react";
import { ErrorBoundary, ScopedErrorBoundary } from "@/components/ErrorBoundary";
import { HomeClient } from "@/components/HomeClient";
import { HeroSkeleton } from "@/components/ui/Skeleton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
