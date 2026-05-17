import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { id, matchId } = await params;

  const match = await prisma.leaguePlayoffMatch.findUnique({
    where: { id: matchId },
    include: { league: true },
  });
  if (!match || match.leagueId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (match.league.adminId !== auth.session.userId && auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (match.status === "COMPLETED") {
    return NextResponse.json({ error: "Already completed" }, { status: 409 });
  }

  const body = await req.json();
  const { score1, score2 } = body;

  if (score1 === undefined || score2 === undefined || score1 < 0 || score2 < 0) {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
  }

  const winnerId = score1 > score2 ? match.player1Id : score2 > score1 ? match.player2Id : null;
  if (!winnerId) {
    return NextResponse.json({ error: "Draws not allowed in playoffs" }, { status: 400 });
  }

  await prisma.leaguePlayoffMatch.update({
    where: { id: matchId },
    data: {
      score1,
      score2,
      winnerId,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  const nextRound = match.round + 1;
  const nextMatchIdx = Math.floor(match.matchIndex / 2);

  const nextMatch = await prisma.leaguePlayoffMatch.findFirst({
    where: {
      leagueId: id,
      bracket: match.bracket,
      round: nextRound,
      matchIndex: nextMatchIdx,
    },
  });

  if (nextMatch) {
    const slot = match.matchIndex % 2 === 0 ? "player1Id" : "player2Id";
    await prisma.leaguePlayoffMatch.update({
      where: { id: nextMatch.id },
      data: {
        [slot]: winnerId,
        status: nextMatch.player1Id && nextMatch.player2Id ? "READY" : "PENDING",
      },
    });
  }

  const updated = await prisma.leaguePlayoffMatch.findMany({
    where: { leagueId: id },
    include: {
      player1: { select: { id: true, username: true, displayName: true } },
      player2: { select: { id: true, username: true, displayName: true } },
      winner: { select: { id: true, username: true, displayName: true } },
    },
    orderBy: [{ round: "asc" }, { matchIndex: "asc" }],
  });

  return NextResponse.json({ success: true, data: { matches: updated } });
}
