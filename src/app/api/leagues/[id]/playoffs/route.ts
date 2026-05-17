import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [matches, qualifiers] = await Promise.all([
    prisma.leaguePlayoffMatch.findMany({
      where: { leagueId: id },
      include: {
        player1: { select: { id: true, username: true, displayName: true } },
        player2: { select: { id: true, username: true, displayName: true } },
        winner: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: [{ round: "asc" }, { matchIndex: "asc" }],
    }),
    prisma.leagueStanding.findMany({
      where: { leagueId: id },
      include: { user: { select: { id: true, username: true, displayName: true } } },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
      take: 20,
    }),
  ]);

  return NextResponse.json({ success: true, data: { matches, qualifiers } });
}
