import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { generateRoundRobin } from "@/lib/league/fixtures";

const StartSeasonSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const league = await prisma.league.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, format: true, status: true },
  });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = league.ownerId === auth.session.userId;
  const isAdmin = auth.session.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = StartSeasonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Block starting a new season if a previous one is still live.
  const liveSeason = await prisma.leagueSeason.findFirst({
    where: { leagueId: league.id, phase: { not: "COMPLETE" } },
    select: { id: true, seasonNumber: true },
  });
  if (liveSeason) {
    return NextResponse.json(
      { error: `Season ${liveSeason.seasonNumber} is still active. Complete it first.` },
      { status: 409 },
    );
  }

  const lastSeason = await prisma.leagueSeason.findFirst({
    where: { leagueId: league.id },
    orderBy: { seasonNumber: "desc" },
    select: { seasonNumber: true },
  });
  const seasonNumber = (lastSeason?.seasonNumber ?? 0) + 1;

  const roster = await prisma.leagueMember.findMany({
    where: { leagueId: league.id, status: "ACTIVE" },
    select: { userId: true },
  });
  const participantIds = roster.map((r) => r.userId);

  if (participantIds.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 active participants to start a season" },
      { status: 400 },
    );
  }

  const pairs = generateRoundRobin(participantIds, {
    doubleRoundRobin: league.format === "DOUBLE_RR",
  });

  const result = await prisma.$transaction(async (tx) => {
    const season = await tx.leagueSeason.create({
      data: {
        leagueId: league.id,
        seasonNumber,
        name: parsed.data.name ?? `Season ${seasonNumber}`,
        startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : null,
        endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
      },
    });

    await tx.leagueParticipant.createMany({
      data: participantIds.map((userId) => ({
        seasonId: season.id,
        userId,
        status: "ACTIVE",
      })),
    });

    await tx.fixture.createMany({
      data: pairs.map((p) => ({
        seasonId: season.id,
        matchday: p.matchday,
        homeId: p.homeId,
        awayId: p.awayId,
        status: "SCHEDULED",
      })),
    });

    await tx.standing.createMany({
      data: participantIds.map((userId) => ({
        seasonId: season.id,
        userId,
      })),
    });

    if (league.status === "DRAFT" || league.status === "REGISTRATION") {
      await tx.league.update({
        where: { id: league.id },
        data: { status: "LIVE" },
      });
    }

    return { seasonId: season.id, seasonNumber, fixtureCount: pairs.length };
  });

  return NextResponse.json(result, { status: 201 });
}
