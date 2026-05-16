import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    select: { id: true, type: true, maxPlayers: true, status: true, inviteCode: true },
  });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  if (league.type !== "PUBLIC" && !league.inviteCode) {
    const body = await req.json().catch(() => ({}));
    if (!body.code) {
      return NextResponse.json({ error: "This league requires an invite code" }, { status: 403 });
    }
  }

  const existing = await prisma.leagueParticipant.findUnique({
    where: { leagueId_userId: { leagueId, userId: auth.session.userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already a participant" }, { status: 409 });
  }

  const count = await prisma.leagueParticipant.count({ where: { leagueId } });
  if (count >= league.maxPlayers) {
    return NextResponse.json({ error: "League is full" }, { status: 400 });
  }

  const participant = await prisma.leagueParticipant.create({
    data: {
      leagueId,
      userId: auth.session.userId,
    },
  });

  await prisma.notification.create({
    data: {
      userId: (await prisma.league.findUnique({ where: { id: leagueId }, select: { adminId: true } }))!.adminId,
      type: "LEAGUE_JOIN",
      title: "New Participant",
      message: `A new player joined your league`,
      link: `/leagues/${leagueId}`,
    },
  });

  return NextResponse.json({ participant }, { status: 201 });
}
