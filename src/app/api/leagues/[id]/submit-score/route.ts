import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { updateStandingsFromFixture } from "@/lib/league-engine";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const body = await req.json();
  const { fixtureId, homeScore, awayScore } = body;

  if (homeScore === undefined || awayScore === undefined || homeScore < 0 || awayScore < 0) {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
  }

  const fixture = await prisma.leagueFixture.findUnique({
    where: { id: fixtureId },
    include: { league: true },
  });
  if (!fixture || fixture.leagueId !== id) {
    return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
  }
  if (fixture.status === "COMPLETED") {
    return NextResponse.json({ error: "Already completed" }, { status: 409 });
  }

  const season = await prisma.leagueSeason.findFirst({
    where: { leagueId: id, status: "ACTIVE" },
  });
  if (!season) return NextResponse.json({ error: "No active season" }, { status: 400 });

  await prisma.leagueFixture.update({
    where: { id: fixtureId },
    data: { homeScore, awayScore, status: "COMPLETED", completedAt: new Date() },
  });

  await updateStandingsFromFixture(prisma, id, season.id, {
    homeUserId: fixture.homeUserId,
    awayUserId: fixture.awayUserId,
    homeScore,
    awayScore,
  });

  return NextResponse.json({ success: true, data: { fixtureId, homeScore, awayScore } });
}
