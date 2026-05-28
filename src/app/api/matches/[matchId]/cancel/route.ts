import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { MatchState } from "@/lib/match-engine/types";
import { notifyMatchCompleted } from "@/lib/match-engine/notifications";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const match = await prisma.matchReport.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.player1Id !== auth.session.userId && match.player2Id !== auth.session.userId) {
    return NextResponse.json({ error: "Only match players can cancel" }, { status: 403 });
  }

  const current = match.statusRaw as MatchState;
  if (current !== MatchState.ACTIVE && current !== MatchState.PENDING_ACCEPTANCE) {
    return NextResponse.json({ error: "Can only cancel active or pending matches" }, { status: 400 });
  }

  const updated = await prisma.matchReport.update({
    where: { id: matchId },
    data: {
      status: MatchState.CANCELLED as any,
      statusRaw: MatchState.CANCELLED,
      notes: `Cancelled by player ${auth.session.userId}`,
    },
  });

  const otherPlayerId = match.player1Id === auth.session.userId ? match.player2Id : match.player1Id;
  try {
    await notifyMatchCompleted(otherPlayerId, "cancelled", matchId);
  } catch {}

  try {
    const reqs = await prisma.matchRequest.findMany({
      where: { statusRaw: MatchState.PENDING_ACCEPTANCE },
    });
    for (const mr of reqs) {
      if (mr.senderId === match.player1Id || mr.senderId === match.player2Id) {
        await prisma.matchRequest.update({
          where: { id: mr.id },
          data: { status: "CANCELLED", statusRaw: MatchState.CANCELLED },
        });
      }
    }
  } catch {}

  return NextResponse.json({ match: updated, status: "CANCELLED" });
}