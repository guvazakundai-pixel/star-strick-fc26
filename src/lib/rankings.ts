import { prisma } from "@/lib/db"

const DECAY_POINTS = 2 // Points lost per week of inactivity
const DECAY_THRESHOLD_DAYS = 7 // Days before decay starts applying

export async function applyRankDecay(): Promise<number> {
  const now = new Date()
  const cutoff = new Date(now.getTime() - DECAY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000)
  
  // Find rankings older than cutoff
  const staleRankings = await prisma.clubRanking.findMany({
    where: {
      lastActive: { lt: cutoff },
      points: { gt: 0 } // Only decay if they have points
    }
  })

  let updatedCount = 0
  await prisma.$transaction(async (tx) => {
    for (const r of staleRankings) {
      const daysInactive = (now.getTime() - new Date(r.lastActive).getTime()) / (1000 * 60 * 60 * 24)
      const weeksInactive = Math.floor(daysInactive / 7)
      const decay = weeksInactive * DECAY_POINTS
      
      if (decay > 0) {
        await tx.clubRanking.update({
          where: { id: r.id },
          data: { 
            points: Math.max(0, r.points - decay),
            lastActive: now 
          }
        })
        updatedCount++
      }
    }
  })
  return updatedCount
}

export async function recordRankHistory(rankingId: string, oldPos: number, newPos: number, oldPts: number, newPts: number) {
  await prisma.rankingHistory.create({
    data: {
      rankingId,
      oldPosition: oldPos,
      newPosition: newPos,
      oldPoints: oldPts,
      newPoints: newPts
    }
  })
}

export async function recalculateGlobalRankings() {
  // Apply decay first
  await applyRankDecay()

  const clubs = await prisma.club.findMany({
    include: {
      clubRankings: { select: { points: true } },
      globalRank: true,
    },
  })

  const clubScores = clubs.map((club) => {
    const totalPlayerPoints = club.clubRankings.reduce((sum, r) => sum + r.points, 0)
    return {
      clubId: club.id,
      totalPoints: totalPlayerPoints,
      wins: club.globalRank?.wins ?? 0,
      losses: club.globalRank?.losses ?? 0,
      currentPos: club.globalRank?.rankPosition ?? 999
    }
  })

  clubScores.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    return b.wins - a.wins
  })

  await prisma.$transaction(
    clubScores.map((score, index) =>
      prisma.globalClubRanking.upsert({
        where: { clubId: score.clubId },
        update: {
          rankPosition: index + 1,
          prevPosition: score.currentPos,
          totalPoints: score.totalPoints,
          wins: score.wins,
          losses: score.losses,
        },
        create: {
          clubId: score.clubId,
          rankPosition: index + 1,
          prevPosition: 0,
          totalPoints: score.totalPoints,
          wins: score.wins,
          losses: score.losses,
        },
      })
    )
  )

  return clubScores.map((score, index) => ({
    clubId: score.clubId,
    rankPosition: index + 1,
    prevPosition: score.currentPos,
    totalPoints: score.totalPoints,
  }))
}
