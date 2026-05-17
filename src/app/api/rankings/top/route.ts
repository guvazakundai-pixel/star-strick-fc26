import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "10")));

  try {
    const rankings = await prisma.playerRanking.findMany({
      take: limit,
      orderBy: { rankPosition: "asc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            playerStats: {
              select: {
                wins: true,
                losses: true,
                draws: true,
                goalsScored: true,
                skillRating: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: rankings });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch rankings", data: [] },
      { status: 500 },
    );
  }
}
