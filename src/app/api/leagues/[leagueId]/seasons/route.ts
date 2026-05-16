import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { generateRoundRobin, DEFAULT_LEAGUE_SETTINGS } from "@/lib/league-engine";

export async function POST(
  req: Request,
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
    return NextResponse.json({ error: "Only the admin can manage seasons" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (action === "start") {
    const participants = await prisma.leagueParticipant.count({ where: { leagueId } });
    if (participants < 2) {
      return NextResponse.json({ error: "Need at least 2 participants" }, { status: 400 });
    }

    const existing = await prisma.leagueFixture.count({ where: { leagueId } });
    if (existing === 0) {
      const playerIds = (await prisma.leagueParticipant.findMany({ where: { leagueId }, select: { userId: true } })).map((p) => p.userId);
      const settings = league.settings ? JSON.parse(league.settings) : DEFAULT_LEAGUE_SETTINGS;
      const fixtures = generateRoundRobin(playerIds, settings.homeAway);

      await prisma.leagueFixture.createMany({
        data: fixtures.map((f) => ({
          leagueId,
          matchday: f.matchday,
          homePlayerId: f.home,
          awayPlayerId: f.away,
        })),
      });
    }

    await prisma.league.update({
      where: { id: leagueId },
      data: { status: "ACTIVE" },
    });

    await prisma.leagueSeason.updateMany({
      where: { leagueId, status: "PENDING" },
      data: { status: "ACTIVE", startedAt: new Date() },
    });

    return NextResponse.json({ status: "ACTIVE" });
  }

  if (action === "end") {
    await prisma.league.update({
      where: { id: leagueId },
      data: { status: "COMPLETED" },
    });

    await prisma.leagueSeason.updateMany({
      where: { leagueId, status: "ACTIVE" },
      data: { status: "COMPLETED", endsAt: new Date() },
    });

    return NextResponse.json({ status: "COMPLETED" });
  }

  if (action === "new_season") {
    const currentSeason = await prisma.leagueSeason.findFirst({
      where: { leagueId },
      orderBy: { number: "desc" },
    });

    const settings = league.settings ? JSON.parse(league.settings) : DEFAULT_LEAGUE_SETTINGS;

    await prisma.leagueFixture.deleteMany({ where: { leagueId } });
    await prisma.leagueParticipant.updateMany({
      where: { leagueId },
      data: { points: 0, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, form: "", cleanSheets: 0 },
    });

    await prisma.leagueSeason.create({
      data: {
        leagueId,
        number: (currentSeason?.number ?? 0) + 1,
        status: "PENDING",
      },
    });

    await prisma.league.update({ where: { id: leagueId }, data: { status: "REGISTRATION" } });

    const participants = await prisma.leagueParticipant.findMany({ where: { leagueId }, select: { userId: true } });
    const playerIds = participants.map((p) => p.userId);
    const fixtures = generateRoundRobin(playerIds, settings.homeAway);

    if (fixtures.length > 0) {
      await prisma.leagueFixture.createMany({
        data: fixtures.map((f) => ({
          leagueId,
          matchday: f.matchday,
          homePlayerId: f.home,
          awayPlayerId: f.away,
        })),
      });

      await prisma.league.update({ where: { id: leagueId }, data: { status: "ACTIVE" } });
      const season = await prisma.leagueSeason.findFirst({ where: { leagueId }, orderBy: { number: "desc" } });
      if (season) {
        await prisma.leagueSeason.update({ where: { id: season.id }, data: { status: "ACTIVE", startedAt: new Date() } });
      }
    }

    return NextResponse.json({ status: "RESET" });
  }

  return NextResponse.json({ error: "Invalid action. Use: start, end, new_season" }, { status: 400 });
}
