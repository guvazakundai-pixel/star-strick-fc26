import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

const rankingSchema = z.array(
  z.object({
    userId: z.string(),
    rankPosition: z.number().int().min(1),
    points: z.number().int().min(0),
  })
)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const { clubId } = await params

  const rankings = await prisma.clubRanking.findMany({
    where: { clubId },
    orderBy: { rankPosition: "asc" },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true, playerStats: true } },
    },
  })

  return NextResponse.json({ rankings })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { clubId } = await params

  const club = await prisma.club.findUnique({ where: { id: clubId } })
  if (!club || club.managerId !== auth.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = rankingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  await prisma.$transaction(
    parsed.data.map((entry) =>
      prisma.clubRanking.upsert({
        where: { clubId_userId: { clubId, userId: entry.userId } },
        update: { rankPosition: entry.rankPosition, points: entry.points },
        create: { clubId, userId: entry.userId, rankPosition: entry.rankPosition, points: entry.points },
      })
    )
  )

  const updated = await prisma.clubRanking.findMany({
    where: { clubId },
    orderBy: { rankPosition: "asc" },
    include: { user: { select: { id: true, username: true } } },
  })

  await (import("@/lib/rankings").then((m) => m.recalculateGlobalRankings()))

  return NextResponse.json({ rankings: updated })
}
