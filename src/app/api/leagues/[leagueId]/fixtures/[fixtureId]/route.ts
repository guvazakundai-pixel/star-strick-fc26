import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { validateFixtureResult } from "@/lib/league-engine";

const SubmitScoreSchema = z.object({
  homeScore: z.number().int().min(0).max(50),
  awayScore: z.number().int().min(0).max(50),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ leagueId: string; fixtureId: string }> },
) {
  const { leagueId, fixtureId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const fixture = await prisma.leagueFixture.findUnique({
    where: { id: fixtureId },
    include: {
      league: { select: { adminId: true, status: true } },
    },
  });
  if (!fixture || fixture.leagueId !== leagueId) {
    return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);

  if (body?.action === "confirm") {
    if (fixture.homeScore === null || fixture.awayScore === null) {
      return NextResponse.json({ error: "Score not submitted yet" }, { status: 400 });
    }

    const isHomePlayer = fixture.homePlayerId === auth.session.userId;
    const isAwayPlayer = fixture.awayPlayerId === auth.session.userId;
    const isAdmin = fixture.league.adminId === auth.session.userId || auth.session.role === "ADMIN";
    if (!isHomePlayer && !isAwayPlayer && !isAdmin) {
      return NextResponse.json({ error: "Only match participants can confirm" }, { status: 403 });
    }

    await prisma.leagueFixture.update({
      where: { id: fixtureId },
      data: { status: "CONFIRMED", playedAt: new Date() },
    });

    const homeScore = fixture.homeScore!;
    const awayScore = fixture.awayScore!;

    const [home, away] = await Promise.all([
      prisma.leagueParticipant.findUnique({
        where: { leagueId_userId: { leagueId, userId: fixture.homePlayerId } },
      }),
      prisma.leagueParticipant.findUnique({
        where: { leagueId_userId: { leagueId, userId: fixture.awayPlayerId } },
      }),
    ]);

    if (home && away) {
      const updates: any = {
        played: { increment: 1 },
        goalsFor: { increment: homeScore },
        goalsAgainst: { increment: awayScore },
        goalDifference: { increment: homeScore - awayScore },
      };

      const homeForm = home.form.slice(-4);
      const awayForm = away.form.slice(-4);

      if (homeScore > awayScore) {
        updates.wins = { increment: 1 };
        updates.points = { increment: 3 };
        updates.form = homeForm + "W";
        if (awayScore === 0) updates.cleanSheets = { increment: 1 };
      } else if (homeScore < awayScore) {
        updates.losses = { increment: 1 };
        updates.form = homeForm + "L";
      } else {
        updates.draws = { increment: 1 };
        updates.points = { increment: 1 };
        updates.form = homeForm + "D";
      }

      await prisma.leagueParticipant.update({
        where: { leagueId_userId: { leagueId, userId: fixture.homePlayerId } },
        data: updates,
      });

      const awayUpdates: any = {
        played: { increment: 1 },
        goalsFor: { increment: awayScore },
        goalsAgainst: { increment: homeScore },
        goalDifference: { increment: awayScore - homeScore },
      };

      if (awayScore > homeScore) {
        awayUpdates.wins = { increment: 1 };
        awayUpdates.points = { increment: 3 };
        awayUpdates.form = awayForm + "W";
        if (homeScore === 0) awayUpdates.cleanSheets = { increment: 1 };
      } else if (awayScore < homeScore) {
        awayUpdates.losses = { increment: 1 };
        awayUpdates.form = awayForm + "L";
      } else {
        awayUpdates.draws = { increment: 1 };
        awayUpdates.points = { increment: 1 };
        awayUpdates.form = awayForm + "D";
      }

      await prisma.leagueParticipant.update({
        where: { leagueId_userId: { leagueId, userId: fixture.awayPlayerId } },
        data: awayUpdates,
      });
    }

    return NextResponse.json({ fixture: { ...fixture, status: "CONFIRMED" } });
  }

  if (body?.action === "submit" || body) {
    const isHomePlayer = fixture.homePlayerId === auth.session.userId;
    const isAwayPlayer = fixture.awayPlayerId === auth.session.userId;
    if (!isHomePlayer && !isAwayPlayer) {
      return NextResponse.json({ error: "Only match participants can submit scores" }, { status: 403 });
    }

    const parsed = SubmitScoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid score", details: parsed.error.flatten() }, { status: 400 });
    }

    const validationError = validateFixtureResult(parsed.data.homeScore, parsed.data.awayScore);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const updated = await prisma.leagueFixture.update({
      where: { id: fixtureId },
      data: {
        homeScore: parsed.data.homeScore,
        awayScore: parsed.data.awayScore,
        status: "PLAYED",
      },
      include: {
        homePlayer: { select: { id: true, username: true, displayName: true } },
        awayPlayer: { select: { id: true, username: true, displayName: true } },
      },
    });

    return NextResponse.json({ fixture: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
