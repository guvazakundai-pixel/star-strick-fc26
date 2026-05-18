import { prisma } from "@/lib/prisma";
import { buildStandings } from "./standings";

/**
 * Recalculate the standings table for a season from all AUTHENTICATED fixtures.
 * Idempotent — safe to call multiple times. Preserves `prevPosition` for movement deltas.
 */
export async function recalcStandings(seasonId: string): Promise<void> {
  const [participants, fixtures, currentStandings] = await Promise.all([
    prisma.leagueParticipant.findMany({
      where: { seasonId, status: "ACTIVE" },
      select: { userId: true },
    }),
    prisma.fixture.findMany({
      where: { seasonId, status: "AUTHENTICATED" },
      select: {
        homeId: true,
        awayId: true,
        homeScore: true,
        awayScore: true,
        authenticatedAt: true,
      },
    }),
    prisma.standing.findMany({
      where: { seasonId },
      select: { userId: true, position: true },
    }),
  ]);

  const prevPositionByUser = new Map(
    currentStandings.map((s) => [s.userId, s.position]),
  );

  const rows = buildStandings(
    participants.map((p) => p.userId),
    fixtures
      .filter((f) => f.homeScore !== null && f.awayScore !== null && f.authenticatedAt !== null)
      .map((f) => ({
        homeId: f.homeId,
        awayId: f.awayId,
        homeScore: f.homeScore!,
        awayScore: f.awayScore!,
        authenticatedAt: f.authenticatedAt!,
      })),
  );

  await prisma.$transaction(
    rows.map((row) =>
      prisma.standing.upsert({
        where: { seasonId_userId: { seasonId, userId: row.userId } },
        create: {
          seasonId,
          userId: row.userId,
          played: row.played,
          wins: row.wins,
          draws: row.draws,
          losses: row.losses,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          points: row.points,
          form: row.form,
          position: row.position,
          prevPosition: prevPositionByUser.get(row.userId) ?? null,
        },
        update: {
          played: row.played,
          wins: row.wins,
          draws: row.draws,
          losses: row.losses,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          points: row.points,
          form: row.form,
          prevPosition: prevPositionByUser.get(row.userId) ?? null,
          position: row.position,
        },
      }),
    ),
  );
}
