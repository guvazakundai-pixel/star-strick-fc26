import { NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { recalculateAllRankings } from "@/lib/rankings"
import { auditAction } from "@/lib/utils"

export async function POST(request: Request) {
  const auth = getAuthFromHeaders(request)
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await recalculateAllRankings()
  await auditAction(auth.id, "RANKING_RECALCULATE", "system", { triggeredBy: auth.id })

  return NextResponse.json({ success: true, message: "Rankings recalculated" })
}

export async function GET() {
  const { prisma } = await import("@/lib/db")
  
  const playerRankings = await prisma.clubRanking.findMany({
    orderBy: { points: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, username: true, avatarUrl: true, playerStats: true } },
      club: { select: { id: true, name: true, slug: true } },
    },
  })

  const clubRankings = await prisma.globalClubRanking.findMany({
    orderBy: { totalPoints: "desc" },
    include: {
      club: { select: { id: true, name: true, slug: true, city: true, logoUrl: true } },
    },
  })

  return NextResponse.json({ players: playerRankings, clubs: clubRankings })
}
