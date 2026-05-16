import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeStandings } from "@/lib/league-engine";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;

  const participants = await prisma.leagueParticipant.findMany({
    where: { leagueId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          stats: { select: { skillRating: true } },
          playerRanking: { select: { rankPosition: true } },
        },
      },
    },
  });

  const fixtures = await prisma.leagueFixture.findMany({
    where: { leagueId, status: { in: ["PLAYED", "CONFIRMED"] } },
    select: {
      homePlayerId: true,
      awayPlayerId: true,
      homeScore: true,
      awayScore: true,
      status: true,
    },
  });

  const rawStandings = participants.map((p) => ({
    userId: p.userId,
    username: p.user.username,
    displayName: p.user.displayName,
    avatarUrl: p.user.avatarUrl,
    points: p.points,
    played: p.played,
    wins: p.wins,
    draws: p.draws,
    losses: p.losses,
    goalsFor: p.goalsFor,
    goalsAgainst: p.goalsAgainst,
    goalDifference: p.goalDifference,
    form: p.form,
    cleanSheets: p.cleanSheets,
  }));

  const standings = computeStandings(rawStandings, fixtures);

  const enriched = standings.map((row) => {
    const participant = participants.find((p) => p.userId === row.userId);
    return {
      ...row,
      skillRating: participant?.user.stats?.skillRating ?? 0,
      globalRank: participant?.user.playerRanking?.rankPosition ?? null,
    };
  });

  return NextResponse.json({ standings: enriched });
}
