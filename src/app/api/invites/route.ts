import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { code } = body;
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const inviteCode = code.toUpperCase();

  const league = await prisma.league.findUnique({
    where: { inviteCode },
    select: { id: true, name: true, maxPlayers: true, status: true, _count: { select: { participants: true } } },
  });

  if (league) {
    if (league.status === "COMPLETED") return NextResponse.json({ error: "League ended" }, { status: 400 });
    if (league._count.participants >= league.maxPlayers) return NextResponse.json({ error: "League full" }, { status: 400 });

    const existing = await prisma.leagueParticipant.findUnique({
      where: { leagueId_userId: { leagueId: league.id, userId: auth.session.userId } },
    });
    if (existing) return NextResponse.json({ error: "Already joined" }, { status: 409 });

    const season = await prisma.leagueSeason.findFirst({
      where: { leagueId: league.id, status: "ACTIVE" },
    });

    await prisma.$transaction(async (tx) => {
      await tx.leagueParticipant.create({ data: { leagueId: league.id, userId: auth.session.userId } });
      if (season) {
        await tx.leagueStanding.create({ data: { leagueId: league.id, userId: auth.session.userId, seasonId: season.id } });
      }
    });

    return NextResponse.json({ success: true, data: { leagueId: league.id, name: league.name } });
  }

  const club = await prisma.club.findUnique({ where: { joinCode: inviteCode } });
  if (club) {
    const existing = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: auth.session.userId, clubId: club.id } },
    });
    if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

    await prisma.clubMember.create({
      data: { userId: auth.session.userId, clubId: club.id, role: "MEMBER", status: "APPROVED" },
    });

    await prisma.club.update({ where: { id: club.id }, data: { clubXp: { increment: 1 } } });

    return NextResponse.json({ success: true, data: { clubId: club.id, name: club.name, tag: club.tag } });
  }

  return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
}
