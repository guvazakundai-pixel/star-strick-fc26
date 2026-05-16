import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { generateRoundRobin, DEFAULT_LEAGUE_SETTINGS } from "@/lib/league-engine";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  const { searchParams } = new URL(req.url);
  const matchday = searchParams.get("matchday");

  const where: any = { leagueId };
  if (matchday) where.matchday = parseInt(matchday);

  const fixtures = await prisma.leagueFixture.findMany({
    where,
    orderBy: [{ matchday: "asc" }, { createdAt: "asc" }],
    include: {
      homePlayer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      awayPlayer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ fixtures });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    select: { id: true, adminId: true, status: true, settings: true },
  });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });
  if (league.adminId !== auth.session.userId && auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the admin can generate fixtures" }, { status: 403 });
  }

  const existingFixtures = await prisma.leagueFixture.count({ where: { leagueId } });
  if (existingFixtures > 0) {
    return NextResponse.json({ error: "Fixtures already generated. Delete them first." }, { status: 409 });
  }

  const participants = await prisma.leagueParticipant.findMany({
    where: { leagueId },
    select: { userId: true },
  });

  if (participants.length < 2) {
    return NextResponse.json({ error: "Need at least 2 participants" }, { status: 400 });
  }

  const settings = league.settings ? JSON.parse(league.settings) : DEFAULT_LEAGUE_SETTINGS;
  const playerIds = participants.map((p) => p.userId);
  const fixtures = generateRoundRobin(playerIds, settings.homeAway);

  if (fixtures.length === 0) {
    return NextResponse.json({ error: "Could not generate fixtures" }, { status: 400 });
  }

  await prisma.leagueFixture.createMany({
    data: fixtures.map((f) => ({
      leagueId,
      matchday: f.matchday,
      homePlayerId: f.home,
      awayPlayerId: f.away,
    })),
  });

  const created = await prisma.leagueFixture.findMany({
    where: { leagueId },
    orderBy: [{ matchday: "asc" }, { createdAt: "asc" }],
    include: {
      homePlayer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      awayPlayer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ fixtures: created, count: created.length }, { status: 201 });
}
