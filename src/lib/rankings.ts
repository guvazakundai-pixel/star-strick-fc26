import { prisma } from "@/lib/db"

export async function recalculateGlobalRankings() {
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
          totalPoints: score.totalPoints,
          wins: score.wins,
          losses: score.losses,
        },
        create: {
          clubId: score.clubId,
          rankPosition: index + 1,
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
    totalPoints: score.totalPoints,
  }))
}
