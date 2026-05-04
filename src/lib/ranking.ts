import { prisma } from "./prisma";

// ─── Player ranking ───────────────────────────────────────────────────────

export type PlayerStatsInput = {
  wins: number;
  losses: number;
  draws?: number;
  goalsScored: number;
  goalsAgainst?: number;
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

/**
 * Form score from the last up-to-5 results, most-recent first.
 * +10 win, -5 loss, +2 draw.
 */
export function formScoreFromRecent(recent: RecentResult[]): number {
  return recent.slice(0, 5).reduce((acc, r) => {
    if (r === "W") return acc + FORM_WIN;
    if (r === "L") return acc - FORM_LOSS;
    return acc + FORM_DRAW;
  }, 0);
}

/**
 * Final score used to sort the global leaderboard.
 * final = corePoints + (skill * 10) + form
 */
export function playerFinalScore(s: PlayerStatsInput): number {
  const core = playerCorePoints(s);
  const skill = s.skillRating ?? 1000;
  const form = s.formScore ?? 0;
  return core + skill * 10 + form;
}

/**
 * ELO-style update.
 * Returns updated skill ratings for both players after a single decisive match.
 * `result` is the score for player A: 1 win, 0.5 draw, 0 loss.
 */
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

// ─── Club ranking ─────────────────────────────────────────────────────────

export type ClubStrengthInput = {
  topPlayerScores: number[]; // pre-sorted desc, take top 5
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

// ─── Recompute global leaderboards (transactional) ────────────────────────

/**
 * Recompute every player's PlayerRanking row.
 * Reads PlayerStats, computes finalScore, sorts, persists rank + rankChange.
 */
export async function recomputePlayerRankings(): Promise<{ updated: number }> {
  const stats = await prisma.playerStats.findMany({
    select: {
      userId: true,
      wins: true,
      losses: true,
      draws: true,
      goalsScored: true,
      goalsAgainst: true,
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
        goalsAgainst: s.goalsAgainst,
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
      await tx.playerStats.update({
        where: { userId: s.userId },
        data: { rank: newRank, prevRank: prev ?? undefined },
      });
    }
  });

  return { updated: scored.length };
}

/**
 * Recompute every club's GlobalClubRanking row.
 * Strength = SUM(top-5 player finalScores in the club) + momentum + activity bonus.
 */
export async function recomputeClubRankings(): Promise<{ updated: number }> {
  const clubs = await prisma.club.findMany({
    select: {
      id: true,
      members: {
        where: { status: "APPROVED" },
        select: {
          user: {
            select: {
              stats: {
                select: {
                  wins: true,
                  losses: true,
                  draws: true,
                  goalsScored: true,
                  goalsAgainst: true,
                  skillRating: true,
                  formScore: true,
                  winStreak: true,
                },
              },
            },
          },
        },
      },
      globalRanking: {
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

  const computed = clubs.map((c) => {
    const stats = c.members
      .map((m) => m.user.stats)
      .filter((s): s is NonNullable<typeof s> => s != null);
    const scores = stats.map((s) => playerFinalScore(s));
    const winStreak = stats.reduce((m, s) => Math.max(m, s.winStreak), 0);
    const recentWins = c.globalRanking?.wins ?? 0;
    const recentLosses = c.globalRanking?.losses ?? 0;
    const out = clubFinalScore({
      topPlayerScores: scores,
      recentWins,
      recentLosses,
      activePlayers: stats.length,
      winStreak,
    });
    return {
      clubId: c.id,
      prevPosition: c.globalRanking?.rankPosition ?? null,
      played: c.globalRanking?.played ?? 0,
      wins: c.globalRanking?.wins ?? 0,
      draws: c.globalRanking?.draws ?? 0,
      losses: c.globalRanking?.losses ?? 0,
      goalsFor: c.globalRanking?.goalsFor ?? 0,
      goalsAgainst: c.globalRanking?.goalsAgainst ?? 0,
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
          rankChange,
          totalPoints: c.totalPoints,
          momentumScore: c.momentum,
          activityBonus: c.activityBonus,
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
          rankChange,
          totalPoints: c.totalPoints,
          momentumScore: c.momentum,
          activityBonus: c.activityBonus,
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
