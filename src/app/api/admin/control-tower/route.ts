import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { divisionFromElo, progressToNext } from "@/lib/divisions";
import { levelFromPoints } from "@/lib/level";

const MODEL_GROUPS: Record<string, string[]> = {
  Core: ["User", "Club", "ClubMember"],
  Matches: ["MatchReport", "MatchRequest", "Dispute", "MatchScreenshot", "MatchDispute", "Rivalry"],
  Tournaments: ["Tournament", "TournamentParticipant", "TournamentMatch", "TournamentGroup", "TournamentGroupStanding"],
  Leagues: ["League", "LeagueParticipant", "LeagueSeason", "LeagueStanding", "LeagueFixture", "LeaguePlayoffMatch"],
  Rankings: ["PlayerRanking", "PlayerStats", "GlobalClubRanking", "ClubRanking", "RankingHistory", "PointsLog"],
  Social: ["Friend", "Follow", "Notification", "NotificationV2", "ActivityLog", "UserActivity", "ClubPost", "PostLike", "PostComment", "PostReaction"],
  Chat: ["ChatRoom", "ChatMember", "ChatMessage"],
  Achievements: ["PlayerAchievement", "ClubAchievement"],
  Admin: ["Report", "AuditLog", "LoginAttempt", "SystemHealth", "ManagerApplication", "Media", "Wager", "ChallengeToken", "ClubActivity", "ClubJoinRequest", "ClubInviteCode", "LeagueInviteCode", "TournamentInviteCode", "MatchMvpVote"],
};

export async function GET() {
  const auth = await requireRole("ADMIN", "MANAGER");
  if (!auth.ok) return auth.response;

  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const dbStart = Date.now();

  const counts: Record<string, number> = {};
  const errors: string[] = [];

  for (const modelName of Object.values(MODEL_GROUPS).flat()) {
    try {
      const count = await (prisma as unknown as Record<string, { count: () => Promise<number> }>)[modelName].count();
      counts[modelName] = count;
    } catch (e) {
      counts[modelName] = -1;
      errors.push(`${modelName}: ${e instanceof PrismaClientKnownRequestError ? e.code : (e as Error).message}`);
    }
  }

  const dbLatency = Date.now() - dbStart;

  // ─── Live pulse ───────────────────────────────────────────
  const [
    newUsers24h,
    newMatches1h,
    pendingMatches,
    openDisputes,
    pendingManagerApps,
    pendingReports,
    activeLeagues,
    liveTournaments,
    recentRegistrations,
    recentMatches,
    recentAudits,
    topGainers24h,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.matchReport.count({ where: { createdAt: { gte: oneHourAgo } } }),
    prisma.matchReport.count({ where: { status: "PENDING" } }),
    prisma.dispute.count({ where: { status: "OPEN" } }).catch(() => 0),
    prisma.managerApplication.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.report.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.league.count({ where: { status: { in: ["LIVE", "REGISTRATION"] } } }).catch(() => 0),
    prisma.tournament.count({ where: { status: "LIVE" } }).catch(() => 0),
    prisma.user.findMany({
      where: { createdAt: { gte: oneDayAgo } },
      select: { id: true, username: true, displayName: true, createdAt: true, country: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.matchReport.findMany({
      where: { createdAt: { gte: oneHourAgo } },
      select: {
        id: true,
        score1: true,
        score2: true,
        status: true,
        createdAt: true,
        player1: { select: { username: true } },
        player2: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.auditLog.findMany({
      select: {
        id: true,
        action: true,
        target: true,
        createdAt: true,
        admin: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.pointsLog.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: oneDayAgo }, pointsChange: { gt: 0 } },
      _sum: { pointsChange: true },
      orderBy: { _sum: { pointsChange: "desc" } },
      take: 5,
    }).catch(() => [] as Array<{ userId: string; _sum: { pointsChange: number | null } }>),
  ]);

  // Resolve top gainer usernames
  const gainerIds = topGainers24h.map((g) => g.userId);
  const gainerUsers = gainerIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: gainerIds } },
        select: { id: true, username: true, displayName: true },
      })
    : [];
  const gainerMap = new Map(gainerUsers.map((u) => [u.id, u]));
  const topGainers = topGainers24h.map((g) => ({
    userId: g.userId,
    username: gainerMap.get(g.userId)?.username ?? "?",
    displayName: gainerMap.get(g.userId)?.displayName ?? null,
    points: g._sum.pointsChange ?? 0,
  }));

  // ─── Self-view (admin's own player snapshot) ─────────────
  let self: {
    username: string;
    role: string;
    elo: number;
    points: number;
    level: { level: number; pct: number; needed: number };
    division: { tier: string; label: string };
    nextDivision: { pct: number; needed: number };
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winStreak: number;
    formHistory: string;
    rankPosition: number | null;
    achievementCount: number;
  } | null = null;

  const stats = await prisma.playerStats.findUnique({ where: { userId: auth.session.userId } });
  if (stats) {
    const ranking = await prisma.playerRanking.findUnique({
      where: { userId: auth.session.userId },
      select: { rankPosition: true },
    });
    const achievementCount = await prisma.playerAchievement.count({
      where: { userId: auth.session.userId },
    });
    const div = divisionFromElo(Math.round(stats.skillRating));
    const nextProg = progressToNext(Math.round(stats.skillRating));
    const lvl = levelFromPoints(stats.points);
    self = {
      username: auth.session.username,
      role: auth.session.role,
      elo: Math.round(stats.skillRating),
      points: stats.points,
      level: { level: lvl.level, pct: lvl.pct, needed: lvl.needed },
      division: { tier: div.tier, label: div.label },
      nextDivision: { pct: nextProg.pct, needed: nextProg.needed },
      matchesPlayed: stats.matchesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      winStreak: stats.winStreak,
      formHistory: stats.formHistory,
      rankPosition: ranking?.rankPosition ?? null,
      achievementCount,
    };
  }

  return NextResponse.json({
    status: errors.length === 0 ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    db: {
      latency: dbLatency,
      totalModels: Object.values(MODEL_GROUPS).flat().length,
      resolvedModels: Object.values(counts).filter((c) => c >= 0).length,
      failedModels: errors.length,
    },
    pulse: {
      newUsers24h,
      newMatches1h,
      pendingMatches,
      openDisputes,
      pendingManagerApps,
      pendingReports,
      activeLeagues,
      liveTournaments,
    },
    self,
    recentRegistrations: recentRegistrations.map((u) => ({
      username: u.username,
      displayName: u.displayName,
      country: u.country,
      createdAt: u.createdAt,
    })),
    recentMatches: recentMatches.map((m) => ({
      id: m.id,
      player1: m.player1.username,
      player2: m.player2.username,
      score: `${m.score1}-${m.score2}`,
      status: m.status,
      createdAt: m.createdAt,
    })),
    recentAudits: recentAudits.map((a) => ({
      id: a.id,
      action: a.action,
      target: a.target,
      admin: a.admin?.username ?? "system",
      createdAt: a.createdAt,
    })),
    topGainers,
    env: ["DATABASE_URL", "TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "JWT_SECRET", "NEXT_PUBLIC_URL"].map((key) => ({
      key,
      set: !!process.env[key],
      inVercel: !!process.env.VERCEL,
    })),
    platform: {
      node: process.version,
      runtime: process.env.VERCEL ? "vercel-serverless" : "node",
      region: process.env.VERCEL_REGION ?? "local",
      vercelEnv: process.env.VERCEL_ENV ?? "development",
    },
    groups: Object.entries(MODEL_GROUPS).map(([group, models]) => ({
      group,
      models: models.map((m) => ({ name: m, count: counts[m] ?? -1 })),
    })),
    errors: errors.length > 0 ? errors : undefined,
  });
}
