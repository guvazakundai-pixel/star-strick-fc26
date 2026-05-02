import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notifyUser, logActivity } from "@/lib/utils"

const matchSchema = z.object({
  clubId: z.string(),
  player1Id: z.string(),
  player2Id: z.string(),
  score1: z.number().int().min(0),
  score2: z.number().int().min(0),
  notes: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = matchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const club = await prisma.club.findUnique({ where: { id: parsed.data.clubId } })
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 })

  const isMember = await prisma.clubMember.findFirst({
    where: { userId: auth.id, clubId: club.id, status: "APPROVED" },
  })
  if (!isMember && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const winnerId = parsed.data.score1 > parsed.data.score2 ? parsed.data.player1Id
    : parsed.data.score2 > parsed.data.score1 ? parsed.data.player2Id
    : null

  const match = await prisma.matchReport.create({
    data: {
      clubId: parsed.data.clubId,
      player1Id: parsed.data.player1Id,
      player2Id: parsed.data.player2Id,
      score1: parsed.data.score1,
      score2: parsed.data.score2,
      winnerId,
      notes: parsed.data.notes ?? null,
      submittedById: auth.id,
    },
  })

  await logActivity(auth.id, "MATCH_REPORT", { matchId: match.id, clubId: club.id })

  if (winnerId) {
    await notifyUser(winnerId, "MATCH_RESULT", "You won!", `${club.name}: ${parsed.data.score1}-${parsed.data.score2}`)
    const loserId = winnerId === parsed.data.player1Id ? parsed.data.player2Id : parsed.data.player1Id
    await notifyUser(loserId, "MATCH_RESULT", "Match lost", `${club.name}: ${parsed.data.score1}-${parsed.data.score2}`)
  }

  return NextResponse.json({ match }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clubId = searchParams.get("clubId")
  const playerId = searchParams.get("playerId")
  const page = parseInt(searchParams.get("page") ?? "0")
  const limit = parseInt(searchParams.get("limit") ?? "20")

  const where: Record<string, unknown> = {}
  if (clubId) where.clubId = clubId
  if (playerId) {
    where.OR = [{ player1Id: playerId }, { player2Id: playerId }]
  }

  const matches = await prisma.matchReport.findMany({
    where,
    include: {
      club: { select: { id: true, name: true, slug: true } },
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
      winner: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: page * limit,
    take: limit,
  })

  const total = await prisma.matchReport.count({ where })
  return NextResponse.json({ matches, total, hasMore: (page + 1) * limit < total })
}
