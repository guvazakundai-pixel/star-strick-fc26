import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const auth = getAuthFromHeaders(request)

  const users = await prisma.user.findMany({
    where: {
      isShadowBanned: false,
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      playerStatus: true,
      playerStats: {
        select: {
          points: true,
          wins: true,
          losses: true,
          draws: true,
          skillRating: true,
          formHistory: true,
          winStreak: true,
        },
      },
      memberships: {
        where: { status: "APPROVED" },
        include: { club: { select: { name: true } } },
        take: 1,
      },
    },
    orderBy: [
      { playerStats: { points: "desc" } },
    ],
  })

  const players = users.map((u, index) => ({
    id: u.id,
    username: u.username,
    avatarUrl: u.avatarUrl,
    playerStatus: u.playerStatus,
    points: u.playerStats?.points ?? 1000,
    wins: u.playerStats?.wins ?? 0,
    losses: u.playerStats?.losses ?? 0,
    draws: u.playerStats?.draws ?? 0,
    skillRating: u.playerStats?.skillRating ?? 1000,
    formHistory: u.playerStats?.formHistory ?? "",
    rank: u.playerStatus === "UNPLACED" ? undefined : index + 1,
    clubName: u.memberships[0]?.club.name,
    isCurrentUser: auth ? u.id === auth.id : false,
  }))

  return NextResponse.json({ players })
}
