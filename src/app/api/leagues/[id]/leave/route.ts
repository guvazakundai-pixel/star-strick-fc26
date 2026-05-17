import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const participant = await prisma.leagueParticipant.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: auth.session.userId } },
  });
  if (!participant) return NextResponse.json({ error: "Not in this league" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.leagueStanding.deleteMany({
      where: { leagueId: id, userId: auth.session.userId },
    });
    await tx.leagueParticipant.delete({ where: { id: participant.id } });
  });

  return NextResponse.json({ success: true });
}
