import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notifyUser } from "@/lib/utils"

const matchSchema = z.object({
  player1Id: z.string(),
  player2Id: z.string(),
  score1: z.number().int().min(0).default(0),
  score2: z.number().int().min(0).default(0),
  clubId: z.string().optional(),
  notes: z.string().max(500).optional(),
})

const confirmSchema = z.object({
  winnerId: z.string(),
})

export async function POST(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = matchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  if (auth.id !== parsed.data.player1Id && auth.id !== parsed.data.player2Id) {
    return NextResponse.json({ error: "You must be one of the players" }, { status: 403 })
  }

  const determinedWinner =
    parsed.data.score1 > parsed.data.score2
      ? parsed.data.player1Id
      : parsed.data.score2 > parsed.data.score1
      ? parsed.data.player2Id
      : null

  const match = await prisma.matchReport.create({
    data: {
      player1Id: parsed.data.player1Id,
      player2Id: parsed.data.player2Id,
      score1: parsed.data.score1,
      score2: parsed.data.score2,
      winnerId: determinedWinner,
      clubId: parsed.data.clubId ?? null,
      notes: parsed.data.notes ?? null,
      submittedById: auth.id,
      status: "PENDING",
      confirmations: { [auth.id]: determinedWinner },
    },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
    },
  })

  const otherPlayerId = auth.id === parsed.data.player1Id ? parsed.data.player2Id : parsed.data.player1Id
  await notifyUser(
    otherPlayerId,
    "MATCH_RESULT",
    `${match.player1.username} vs ${match.player2.username}`,
    `Score: ${parsed.data.score1} - ${parsed.data.score2}. Confirm the result.`,
    `/matches/requests`
  )

  return NextResponse.json({ match }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get("playerId") ?? auth.id
  const status = searchParams.get("status")
  const clubId = searchParams.get("clubId")

  const where: Record<string, unknown> = {
    OR: [{ player1Id: playerId }, { player2Id: playerId }],
  }
  if (status) where.status = status
  if (clubId) where.clubId = clubId

  const matches = await prisma.matchReport.findMany({
    where,
    include: {
      club: { select: { id: true, name: true, slug: true } },
      player1: { select: { id: true, username: true, avatarUrl: true } },
      player2: { select: { id: true, username: true, avatarUrl: true } },
      winner: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ matches })
}

export async function PATCH(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get("id")
  if (!matchId) return NextResponse.json({ error: "Missing match id" }, { status: 400 })

  const body = await request.json()
  const parsed = confirmSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const match = await prisma.matchReport.findUnique({
    where: { id: matchId },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
    },
  })

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })

  if (auth.id !== match.player1Id && auth.id !== match.player2Id) {
    return NextResponse.json({ error: "Not your match" }, { status: 403 })
  }

  const existingConf = (match.confirmations as Record<string, string> | null) ?? {}
  if (existingConf[auth.id]) {
    return NextResponse.json({ error: "Already confirmed" }, { status: 409 })
  }

  const updatedConf = { ...existingConf, [auth.id]: parsed.data.winnerId }

  const bothConfirmed = updatedConf[match.player1Id] && updatedConf[match.player2Id]

  if (bothConfirmed) {
    const p1Vote = updatedConf[match.player1Id]
    const p2Vote = updatedConf[match.player2Id]

    if (p1Vote === p2Vote) {
      await applyMatchResult(match.id, p1Vote, match.player1Id, match.player2Id, match.score1, match.score2)

      const updated = await prisma.matchReport.update({
        where: { id: matchId },
        data: {
          status: "APPROVED",
          winnerId: p1Vote,
          confirmations: updatedConf,
          approvedAt: new Date(),
        },
        include: {
          player1: { select: { id: true, username: true } },
          player2: { select: { id: true, username: true } },
          winner: { select: { id: true, username: true } },
        },
      })

      const loserId = p1Vote === match.player1Id ? match.player2Id : match.player1Id
      await notifyUser(loserId, "MATCH_RESULT", "Match lost", `Your match was confirmed. Better luck next time.`)
      if (p1Vote) await notifyUser(p1Vote, "MATCH_RESULT", "Match won!", `Your match was confirmed. +30 points!`)

      return NextResponse.json({ match: updated, autoApproved: true })
    } else {
      await prisma.matchReport.update({
        where: { id: matchId },
        data: {
          status: "FLAGGED",
          confirmations: updatedConf,
          isDisputed: true,
        },
      })
      return NextResponse.json({ match: null, flagged: true, message: "Results don't match. Flagged for review." })
    }
  } else {
    await prisma.matchReport.update({
      where: { id: matchId },
      data: {
        status: "ACCEPTED",
        confirmations: updatedConf,
      },
    })
    return NextResponse.json({ match: null, pending: true, message: "Waiting for other player to confirm." })
  }
}

async function applyMatchResult(
  matchId: string,
  winnerId: string | null,
  player1Id: string,
  player2Id: string,
  score1: number,
  score2: number
) {
  await prisma.$transaction(async (tx) => {
    for (const [pid, goalsFor, goalsAgainst] of [
      [player1Id, score1, score2],
      [player2Id, score2, score1],
    ] as [string, number, number][]) {
      const isWinner = pid === winnerId
      const stats = await tx.playerStats.findUnique({ where: { userId: pid } })
      if (!stats) continue

      const form = (stats.formHistory || "").split("").slice(-4)
      form.push(isWinner ? "W" : "L")
      const newForm = form.slice(-5).join("")

      await tx.playerStats.update({
        where: { userId: pid },
        data: {
          matchesPlayed: { increment: 1 },
          wins: isWinner ? { increment: 1 } : undefined,
          losses: isWinner ? undefined : { increment: 1 },
          goalsScored: { increment: goalsFor },
          goalsConceded: { increment: goalsAgainst },
          points: { increment: isWinner ? 30 : -10 },
          formHistory: newForm,
          formScore: calcFormScore(newForm),
          winStreak: isWinner ? { increment: 1 } : { set: 0 },
        },
      })

      const user = await tx.user.findUnique({ where: { id: pid } })
      if (user && user.playerStatus === "UNPLACED") {
        await tx.user.update({
          where: { id: pid },
          data: { playerStatus: "PLACED" },
        })
      }
    }
  })
}

function calcFormScore(form: string): number {
  const weights = [1, 1.2, 1.5, 1.8, 2.2]
  let total = 0
  let weightSum = 0
  for (let i = 0; i < form.length; i++) {
    const val = form[i] === "W" ? 1 : 0
    total += val * weights[i]
    weightSum += weights[i]
  }
  return weightSum > 0 ? Math.round((total / weightSum) * 100) : 0
}
