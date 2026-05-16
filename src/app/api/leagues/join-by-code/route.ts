import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";

const JoinByCodeSchema = z.object({
  code: z.string().min(1),
});

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = JoinByCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const league = await prisma.league.findUnique({
    where: { inviteCode: parsed.data.code.toUpperCase() },
    select: { id: true, name: true, type: true, maxPlayers: true, status: true },
  });

  if (!league) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  if (league.status === "COMPLETED") {
    return NextResponse.json({ error: "This league has ended" }, { status: 400 });
  }

  const existing = await prisma.leagueParticipant.findUnique({
    where: { leagueId_userId: { leagueId: league.id, userId: auth.session.userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already a participant" }, { status: 409 });
  }

  const count = await prisma.leagueParticipant.count({ where: { leagueId: league.id } });
  if (count >= league.maxPlayers) {
    return NextResponse.json({ error: "League is full" }, { status: 400 });
  }

  await prisma.leagueParticipant.create({
    data: { leagueId: league.id, userId: auth.session.userId },
  });

  return NextResponse.json({
    success: true,
    league: { id: league.id, name: league.name },
  });
}
