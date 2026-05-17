import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { score1, score2, screenshotUrl } = await req.json();

  if (typeof score1 !== "number" || typeof score2 !== "number" || score1 < 0 || score2 < 0) {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
  }

  const match = await prisma.matchReport.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.statusRaw !== "PENDING") return NextResponse.json({ error: "Match already resolved" }, { status: 400 });
  if (match.player1Id !== auth.session.userId && match.player2Id !== auth.session.userId) {
    return NextResponse.json({ error: "Not your match" }, { status: 403 });
  }

  const winnerId = score1 > score2 ? match.player1Id : score2 > score1 ? match.player2Id : null;

  const confirmations = {
    ...((match.confirmations as Record<string, unknown>) || {}),
    [auth.session.userId]: { score1, score2, screenshotUrl, submittedAt: new Date().toISOString() },
  } as Prisma.InputJsonValue;

  const playersSubmitted = Object.keys(confirmations).length;

  if (playersSubmitted >= 2) {
    await prisma.matchReport.update({
      where: { id: matchId },
      data: {
        score1,
        score2,
        winnerId,
        status: "COMPLETED",
        statusRaw: "COMPLETED",
        confirmations,
        approvedById: auth.session.userId,
        approvedAt: new Date(),
      },
    });
  } else {
    await prisma.matchReport.update({
      where: { id: matchId },
      data: {
        score1,
        score2,
        status: "AWAITING_CONFIRMATION",
        statusRaw: "AWAITING_CONFIRMATION",
        confirmations,
        submittedById: auth.session.userId,
      },
    });
  }

  return NextResponse.json({ success: true, status: playersSubmitted >= 2 ? "COMPLETED" : "AWAITING_CONFIRMATION" });
}
