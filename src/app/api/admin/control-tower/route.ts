import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

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

type ModelCounts = Record<string, number>;

export async function GET() {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const counts: ModelCounts = {};
  const errors: string[] = [];
  const dbStart = Date.now();

  for (const modelName of Object.values(MODEL_GROUPS).flat()) {
    try {
      const count = await (prisma as any)[modelName].count();
      counts[modelName] = count;
    } catch (e) {
      counts[modelName] = -1;
      errors.push(`${modelName}: ${e instanceof PrismaClientKnownRequestError ? e.code : (e as Error).message}`);
    }
  }

  const dbLatency = Date.now() - dbStart;

  const envChecks = [
    "DATABASE_URL",
    "TURSO_DATABASE_URL",
    "TURSO_AUTH_TOKEN",
    "JWT_SECRET",
    "NEXT_PUBLIC_URL",
  ];

  return NextResponse.json({
    status: errors.length === 0 ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    db: {
      latency: dbLatency,
      totalModels: Object.values(MODEL_GROUPS).flat().length,
      resolvedModels: Object.values(counts).filter((c) => c >= 0).length,
      failedModels: errors.length,
    },
    env: envChecks.map((key) => ({
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
