import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const league = await prisma.league.findUnique({
    where: { id },
    include: { _count: { select: { participants: true } } },
  });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  if (league.status === "COMPLETED") {
    return NextResponse.json({ error: "League has ended" }, { status: 400 });
  }

  if (league._count.participants >= league.maxPlayers) {
    return NextResponse.json({ error: "League is full" }, { status: 400 });
  }

  const existing = await prisma.leagueParticipant.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: auth.session.userId } },
  });
  if (existing) return NextResponse.json({ error: "Already joined" }, { status: 409 });

  const season = await prisma.leagueSeason.findFirst({
    where: { leagueId: id, status: "ACTIVE" },
    orderBy: { seasonNumber: "desc" },
  });

  await prisma.$transaction(async (tx) => {
    await tx.leagueParticipant.create({
      data: { leagueId: id, userId: auth.session.userId },
    });
    if (season) {
      await tx.leagueStanding.create({
        data: {
          leagueId: id,
          userId: auth.session.userId,
          seasonId: season.id,
        },
      });
    }
  });

  return NextResponse.json({ success: true });
}
