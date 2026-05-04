import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { calculatePlayerPoints, calculateFormScore, calculateFinalPlayerScore } from "@/lib/rankings"

export async function GET() {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.toLowerCase()

  const users = await prisma.user.findMany({
    where: {
      isShadowBanned: false,
      ...(q ? {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          {
            memberships: {
              some: {
                club: { name: { contains: q, mode: "insensitive" } },
              },
            },
          },
        ],
      } : {},
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      playerStatus: true,
      memberships: {
        where: { status: "APPROVED" },
        include: { club: { select: { id: true, name: true } },
        take: 1,
      },
      playerStats: {
        select: {
          points: true,
          wins: true,
          losses: true,
          draws: true,
          goalsScored: true,
          skillRating: true,
          formHistory: true,
          winStreak: true,
        },
      },
    },
    orderBy: [
      { playerStats: { points: "desc" } },
    ],
  })

  const players = users.map((u, index) => {
    const stats = u.playerStats
    const points = stats
      ? calculatePlayerPoints(stats.wins, stats.losses, stats.goalsScored)
      : 1000
    const formScore = stats ? calculateFormScore(stats.formHistory || "") : 0
    const finalScore = stats
      ? calculateFinalPlayerScore(points, stats.skillRating, formScore)
      : 1000 + (stats?.skillRating ?? 1000) * 10 + 0

    return {
      id: u.id,
      username: u.username,
      avatarUrl: u.avatarUrl,
      playerStatus: u.playerStatus,
      points,
      wins: stats?.wins ?? 0,
      losses: stats?.losses ?? 0,
      draws: stats?.draws ?? 0,
      skillRating: stats?.skillRating ?? 1000,
      formScore,
      finalScore,
      winStreak: stats?.winStreak ?? 0,
      rank: u.playerStatus === "UNPLACED" ? undefined : index + 1,
      clubName: u.memberships[0]?.club.name,
      clubId: u.memberships[0]?.club.id,
      isCurrentUser: false,
    }
  })

  return NextResponse.json({ players })
}

export async function POST(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, club: clubName } = await request.json()

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: name }, { email: name }] },
  })
  if (existing) {
    return NextResponse.json({ error: "Already exists" }, { status: 409 })
  }

  const user = await prisma.user.create({
    data: {
      username: name,
      email: `${name.toLowerCase()}@local.dev`,
      passwordHash: "mock",
      role: "PLAYER",
      playerStatus: "UNPLACED",
      playerStats: { create: {} },
    },
    select: { id: true, username: true, playerStatus: true },
  })

  if (clubName && clubName.trim()) {
    const club = await prisma.club.findFirst({
      where: { name: { equals: clubName, mode: "insensitive" } },
    })

    if (!club) {
      await prisma.club.create({
        data: {
          name: clubName,
          slug: clubName.toLowerCase().replace(/\s+/g, "-"),
          city: "Zimbabwe",
          manager: { connect: { id: user.id } },
        },
      })
    }
  }

  return NextResponse.json({ user }, { status: 201 })
}
