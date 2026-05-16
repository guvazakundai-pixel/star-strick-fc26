import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { DEFAULT_LEAGUE_SETTINGS, computeStandings } from "@/lib/league-engine";

const PatchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(1000).optional(),
  type: z.enum(["PUBLIC", "PRIVATE", "FRIENDS"]).optional(),
  maxPlayers: z.number().int().min(2).max(32).optional(),
  status: z.enum(["REGISTRATION", "ACTIVE", "COMPLETED", "PAUSED"]).optional(),
  logoUrl: z.string().url().optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      admin: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      season: true,
      _count: { select: { participants: true, fixtures: true } },
    },
  });

  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  const participants = await prisma.leagueParticipant.findMany({
    where: { leagueId },
    orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          stats: { select: { skillRating: true, wins: true, losses: true } },
          playerRanking: { select: { rankPosition: true } },
        },
      },
    },
  });

  const fixtures = await prisma.leagueFixture.findMany({
    where: { leagueId },
    orderBy: [{ matchday: "asc" }, { createdAt: "asc" }],
    include: {
      homePlayer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      awayPlayer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  const standingRows = participants.map((p) => ({
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
    skillRating: p.user.stats?.skillRating ?? 0,
    globalRank: p.user.playerRanking?.rankPosition ?? 0,
  }));

  const matchesByMatchday: Record<number, typeof fixtures> = {};
  for (const f of fixtures) {
    if (!matchesByMatchday[f.matchday]) matchesByMatchday[f.matchday] = [];
    matchesByMatchday[f.matchday].push(f);
  }

  return NextResponse.json({
    league: {
      ...league,
      settings: league.settings ? JSON.parse(league.settings) : DEFAULT_LEAGUE_SETTINGS,
      participantCount: league._count.participants,
      fixtureCount: league._count.fixtures,
    },
    standings: standingRows,
    fixtures,
    matchesByMatchday: Object.entries(matchesByMatchday).map(([day, matches]) => ({
      matchday: parseInt(day),
      matches,
    })),
    season: league.season,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const league = await prisma.league.findUnique({ where: { id: leagueId }, select: { adminId: true } });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (league.adminId !== auth.session.userId && auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the league admin can edit settings" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.league.update({ where: { id: leagueId }, data: parsed.data });

  return NextResponse.json({ league: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const league = await prisma.league.findUnique({ where: { id: leagueId }, select: { adminId: true } });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (league.adminId !== auth.session.userId && auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the league admin can delete" }, { status: 403 });
  }

  await prisma.league.delete({ where: { id: leagueId } });

  return NextResponse.json({ success: true });
}
