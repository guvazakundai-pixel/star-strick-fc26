import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  const type = searchParams.get("type") ?? "all"

  if (!q || q.length < 2) {
    return NextResponse.json({ players: [], clubs: [] })
  }

  const results: Record<string, unknown[]> = {}

  if (type === "all" || type === "clubs") {
    const clubs = await prisma.club.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
        ],
        isBanned: false,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        logoUrl: true,
        globalRank: { select: { rankPosition: true } },
        _count: { select: { members: true } },
      },
      take: 20,
    })
    results.clubs = clubs
  }

  if (type === "all" || type === "players") {
    const players = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
        ],
        isShadowBanned: false,
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        playerStats: { select: { wins: true, losses: true, goalsScored: true } },
      },
      take: 20,
    })
    results.players = players
  }

  return NextResponse.json(results)
}
