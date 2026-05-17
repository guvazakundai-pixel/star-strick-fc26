import { prisma } from "./prisma";

export type PlayerStatsInput = {
  wins: number;
  losses: number;
  draws?: number;
  goalsScored: number;
  goalsConceded?: number;
  skillRating?: number;
  formScore?: number;
};

export type RecentResult = "W" | "L" | "D";

const BASE_POINTS_WIN = 30;
const BASE_POINTS_LOSS = 10;
const BASE_POINTS_GOAL = 2;
const FORM_WIN = 10;
const FORM_LOSS = 5;
const FORM_DRAW = 2;
const ELO_K = 32;

export function playerCorePoints(s: PlayerStatsInput): number {
  return s.wins * BASE_POINTS_WIN + s.goalsScored * BASE_POINTS_GOAL - s.losses * BASE_POINTS_LOSS;
}

export function formScoreFromRecent(recent: RecentResult[]): number {
  return recent.slice(0, 5).reduce((acc, r) => {
    if (r === "W") return acc + FORM_WIN;
    if (r === "L") return acc - FORM_LOSS;
    return acc + FORM_DRAW;
  }, 0);
}

export function playerFinalScore(s: PlayerStatsInput): number {
  const core = playerCorePoints(s);
  const skill = s.skillRating ?? 1000;
  const form = s.formScore ?? 0;
  return core + skill * 10 + form;
}

export function eloUpdate(
  ratingA: number,
  ratingB: number,
  result: 0 | 0.5 | 1,
  k: number = ELO_K,
): { ratingA: number; ratingB: number; deltaA: number } {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const deltaA = k * (result - expectedA);
  return {
    ratingA: ratingA + deltaA,
    ratingB: ratingB - deltaA,
    deltaA,
  };
}

export type ClubStrengthInput = {
  topPlayerScores: number[];
  recentWins: number;
  recentLosses: number;
  activePlayers: number;
  winStreak: number;
};

const TOP_PLAYERS = 5;
const ACTIVE_PLAYER_BONUS = 8;
const WIN_STREAK_BONUS = 6;

export function clubTotalPoints(scores: number[]): number {
  return [...scores].sort((a, b) => b - a).slice(0, TOP_PLAYERS).reduce((a, b) => a + b, 0);
}

export function clubMomentum(recentWins: number, recentLosses: number): number {
  return (recentWins - recentLosses) * 5;
}

export function clubActivityBonus(activePlayers: number, winStreak: number): number {
  return activePlayers * ACTIVE_PLAYER_BONUS + winStreak * WIN_STREAK_BONUS;
}

export function clubFinalScore(c: ClubStrengthInput): {
  totalPoints: number;
  momentum: number;
  activityBonus: number;
  finalScore: number;
} {
  const totalPoints = clubTotalPoints(c.topPlayerScores);
  const momentum = clubMomentum(c.recentWins, c.recentLosses);
  const activityBonus = clubActivityBonus(c.activePlayers, c.winStreak);
  return {
    totalPoints,
    momentum,
    activityBonus,
    finalScore: totalPoints + momentum + activityBonus,
  };
}

export async function recomputePlayerRankings(): Promise<{ updated: number }> {
  const stats = await prisma.playerStats.findMany({
    select: {
      userId: true,
      wins: true,
      losses: true,
      draws: true,
      goalsScored: true,
      goalsConceded: true,
      skillRating: true,
      formScore: true,
      points: true,
    },
  });

  const scored = stats
    .map((s) => ({
      userId: s.userId,
      points: s.points,
      finalScore: playerFinalScore({
        wins: s.wins,
        losses: s.losses,
        draws: s.draws,
        goalsScored: s.goalsScored,
        goalsConceded: s.goalsConceded,
        skillRating: s.skillRating,
        formScore: s.formScore,
      }),
    }))
    .sort((a, b) => b.finalScore - a.finalScore);

  const previous = await prisma.playerRanking.findMany({
    select: { userId: true, rankPosition: true },
  });
  const prevMap = new Map(previous.map((p) => [p.userId, p.rankPosition]));

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < scored.length; i++) {
      const s = scored[i];
      const newRank = i + 1;
      const prev = prevMap.get(s.userId) ?? null;
      const rankChange = prev != null ? prev - newRank : 0;
      await tx.playerRanking.upsert({
        where: { userId: s.userId },
        create: {
          userId: s.userId,
          rankPosition: newRank,
          prevPosition: prev,
          rankChange,
          points: s.points,
          finalScore: s.finalScore,
        },
        update: {
          rankPosition: newRank,
          prevPosition: prev,
          rankChange,
          points: s.points,
          finalScore: s.finalScore,
        },
      });
    }
  });

  return { updated: scored.length };
}

export async function recomputeClubRankings(): Promise<{ updated: number }> {
  const clubs = await prisma.club.findMany({
    select: {
      id: true,
      members: {
        where: { status: "APPROVED" },
        select: {
          userId: true,
        },
      },
      globalRank: {
        select: {
          rankPosition: true,
          wins: true,
          losses: true,
          draws: true,
          goalsFor: true,
          goalsAgainst: true,
          played: true,
        },
      },
    },
  });

  const allUserIds = clubs.flatMap((c) => c.members.map((m) => m.userId));
  const allStats = await prisma.playerStats.findMany({
    where: { userId: { in: allUserIds } },
    select: {
      userId: true,
      wins: true,
      losses: true,
      draws: true,
      goalsScored: true,
      goalsConceded: true,
      skillRating: true,
      formScore: true,
      winStreak: true,
    },
  });
  const statsMap = new Map(allStats.map((s) => [s.userId, s]));

  const computed = clubs.map((c) => {
    const memberStats = c.members
      .map((m) => statsMap.get(m.userId))
      .filter((s): s is NonNullable<typeof s> => s != null);
    const scores = memberStats.map((s) =>
      playerFinalScore({
        wins: s.wins,
        losses: s.losses,
        draws: s.draws,
        goalsScored: s.goalsScored,
        goalsConceded: s.goalsConceded,
        skillRating: s.skillRating,
        formScore: s.formScore,
      }),
    );
    const winStreak = memberStats.reduce((m, s) => Math.max(m, s.winStreak), 0);
    const recentWins = c.globalRank?.wins ?? 0;
    const recentLosses = c.globalRank?.losses ?? 0;
    const out = clubFinalScore({
      topPlayerScores: scores,
      recentWins,
      recentLosses,
      activePlayers: memberStats.length,
      winStreak,
    });
    return {
      clubId: c.id,
      prevPosition: c.globalRank?.rankPosition ?? null,
      played: c.globalRank?.played ?? 0,
      wins: c.globalRank?.wins ?? 0,
      draws: c.globalRank?.draws ?? 0,
      losses: c.globalRank?.losses ?? 0,
      goalsFor: c.globalRank?.goalsFor ?? 0,
      goalsAgainst: c.globalRank?.goalsAgainst ?? 0,
      ...out,
    };
  });

  computed.sort((a, b) => b.finalScore - a.finalScore);

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < computed.length; i++) {
      const c = computed[i];
      const newRank = i + 1;
      const rankChange = c.prevPosition != null ? c.prevPosition - newRank : 0;
      await tx.globalClubRanking.upsert({
        where: { clubId: c.clubId },
        create: {
          clubId: c.clubId,
          rankPosition: newRank,
          prevPosition: c.prevPosition,
          totalPoints: c.totalPoints,
          momentum: c.momentum,
          played: c.played,
          wins: c.wins,
          draws: c.draws,
          losses: c.losses,
          goalsFor: c.goalsFor,
          goalsAgainst: c.goalsAgainst,
        },
        update: {
          rankPosition: newRank,
          prevPosition: c.prevPosition,
          totalPoints: c.totalPoints,
          momentum: c.momentum,
        },
      });
    }
  });

  return { updated: computed.length };
}

export function rankBadge(change: number): "up" | "down" | "flat" {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "flat";
}