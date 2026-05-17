import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { generateRoundRobinFixtures } from "@/lib/league-engine";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (league.adminId !== auth.session.userId && auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.leagueFixture.count({ where: { leagueId: id } });
  if (existing > 0) {
    return NextResponse.json({ error: "Fixtures already generated" }, { status: 409 });
  }

  const participants = await prisma.leagueParticipant.findMany({
    where: { leagueId: id },
    select: { userId: true },
  });

  if (participants.length < 2) {
    return NextResponse.json({ error: "Need at least 2 participants" }, { status: 400 });
  }

  const season = await prisma.leagueSeason.findFirst({
    where: { leagueId: id, status: "ACTIVE" },
    orderBy: { seasonNumber: "desc" },
  });
  if (!season) return NextResponse.json({ error: "No active season" }, { status: 400 });

  const fixtureInputs = generateRoundRobinFixtures(
    id,
    season.id,
    participants.map((p) => p.userId),
    league.rounds,
    league.homeAway,
  );

  await prisma.leagueFixture.createMany({ data: fixtureInputs });

  await prisma.league.update({ where: { id }, data: { status: "LIVE" } });

  const fixtures = await prisma.leagueFixture.findMany({
    where: { leagueId: id },
    include: {
      homeUser: { select: { id: true, username: true, displayName: true } },
      awayUser: { select: { id: true, username: true, displayName: true } },
    },
    orderBy: [{ matchday: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ success: true, data: { fixtures, count: fixtureInputs.length } });
}
