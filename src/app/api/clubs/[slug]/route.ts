import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const club = await prisma.club.findUnique({
    where: { slug },
    include: {
      manager: { select: { id: true, username: true, avatarUrl: true } },
      members: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          ranking: true,
        },
      },
      globalRank: true,
      media: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 })
  }

  const topPlayers = await prisma.clubRanking.findMany({
    where: { clubId: club.id },
    orderBy: { rankPosition: "asc" },
    take: 5,
    include: {
      user: { select: { id: true, username: true, avatarUrl: true, playerStats: true } },
    },
  })

  return NextResponse.json({ club, topPlayers })
}
