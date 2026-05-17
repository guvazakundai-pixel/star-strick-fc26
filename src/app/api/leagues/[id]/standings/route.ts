import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const standings = await prisma.leagueStanding.findMany({
    where: { leagueId: id },
    include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    orderBy: [
      { points: "desc" },
      { goalDifference: "desc" },
      { goalsFor: "desc" },
      { wins: "desc" },
    ],
  });

  return NextResponse.json({ success: true, data: standings });
}
