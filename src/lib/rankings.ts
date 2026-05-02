import { prisma } from "@/lib/db"

// ─── Player Ranking Algorithm ───────────────────────────────────────────────

export function calculatePlayerPoints(
  wins: number,
  losses: number,
  goalsScored: number
): number {
  // Core formula: (wins * 30) + (goals_scored * 2) - (losses * 10)
  return wins * 30 + goalsScored * 2 - losses * 10
}

export function calculateSkillRating(
  currentRating: number,
  opponentRating: number,
  result: "win" | "loss" | "draw",
  kFactor = 32
): number {
  // ELO-like calculation
  const expected = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400))
  const actual = result === "win" ? 1 : result === "loss" ? 0 : 0.5

  // Bonus for beating higher-ranked opponents
  const bonus = result === "win" && opponentRating > currentRating ? 10 : 0
  
  return Math.max(0, Math.round(currentRating + kFactor * (actual - expected) + bonus))
}

export function calculateFormScore(formHistory: string): number {
  // Last 5 matches weighted: Win = +10, Loss = -5, Draw = 0
  // formHistory format: "WLDWW" (newest first)
  const last5 = formHistory.slice(0, 5)
  let score = 0
  for (let i = 0; i < last5.length; i++) {
    const weight = 1 - i * 0.15 // Decay older matches
    if (last5[i] === "W") score += 10 * weight
    else if (last5[i] === "L") score -= 5 * weight
  }
  return Math.round(score)
}

export function calculateFinalPlayerScore(
  points: number,
  skillRating: number,
  formScore: number
): number {
  // final_score = points + (skill_rating * 10) + form_score
  return points + skillRating * 10 + formScore
}

// ─── Club Ranking Algorithm ─────────────────────────────────────────────────

export function calculateClubTotalPoints(playerScores: number[]): number {
  // Sum of top 5 player scores
  const sorted = [...playerScores].sort((a, b) => b - a)
  return sorted.slice(0, 5).reduce((sum, s) => sum + s, 0)
}

export function calculateMomentumScore(
  recentWins: number,
  recentLosses: number
): number {
  // momentum = (recent wins - recent losses) * 5
  return (recentWins - recentLosses) * 5
}

export function calculateClubFinalScore(
  totalPoints: number,
  momentum: number,
  activityBonus: number
): number {
  // club_score = total_points + momentum + activity_bonus
  return totalPoints + momentum + activityBonus
}

// ─── Recalculate All Rankings ───────────────────────────────────────────────

export async function recalculateAllRankings(): Promise<void> {
  const now = new Date()

  // 1. Get all players with stats
  const users = await prisma.user.findMany({
    where: { role: "PLAYER" },
    include: { playerStats: true, clubRankings: true },
  })

  // 2. Calculate and update player scores
  const playerFinalScores: Record<string, number> = {}
  
  await prisma.$transaction(async (tx) => {
    for (const user of users) {
      if (!user.playerStats) continue

      const points = calculatePlayerPoints(
        user.playerStats.wins,
        user.playerStats.losses,
        user.playerStats.goalsScored
      )

      const formScore = calculateFormScore(user.playerStats.formHistory || "")
      const finalScore = calculateFinalPlayerScore(points, user.playerStats.wins * 10, formScore) // Simplified skill rating
      
      playerFinalScores[user.id] = finalScore

      // Update or create club ranking entry
      for (const membership of user.memberships || []) {
        if (membership.status !== "APPROVED") continue
        
        const existing = await tx.clubRanking.findUnique({
          where: { clubId_userId: { clubId: membership.clubId, userId: user.id } },
        })

        const oldPos = existing?.rankPosition ?? 0
        const oldPts = existing?.points ?? 0

        await tx.clubRanking.upsert({
          where: { clubId_userId: { clubId: membership.clubId, userId: user.id } },
          update: { 
            points: finalScore, 
            lastActive: now,
            prevPosition: oldPos,
            formHistory: user.playerStats.formHistory || "",
          },
          create: {
            clubId: membership.clubId,
            userId: user.id,
            rankPosition: 0, // Will be recalculated
            points: finalScore,
            lastActive: now,
            formHistory: user.playerStats.formHistory || "",
          },
        })

        // Record history if position changed
        if (existing && oldPos !== 0) {
          await tx.rankingHistory.create({
            data: {
              rankingId: existing.id,
              oldPosition: oldPos,
              newPosition: 0, // Updated below
              oldPoints: oldPts,
              newPoints: finalScore,
            },
          })
        }
      }
    }

    // 3. Sort and update positions within each club
    const clubs = await tx.club.findMany({
      include: { rankings: { include: { user: true } } },
    })

    for (const club of clubs) {
      const sorted = [...club.rankings].sort((a, b) => b.points - a.points)
      
      for (let i = 0; i < sorted.length; i++) {
        const newPos = i + 1
        await tx.clubRanking.update({
          where: { id: sorted[i].id },
          data: { rankPosition: newPos },
        })

        // Record history if position changed
        if (sorted[i].prevPosition !== null && sorted[i].prevPosition !== newPos) {
          await tx.rankingHistory.create({
            data: {
              rankingId: sorted[i].id,
              oldPosition: sorted[i].prevPosition ?? newPos,
              newPosition: newPos,
              oldPoints: sorted[i].points,
              newPoints: sorted[i].points,
            },
          })
        }
      }
    }

    // 4. Recalculate global club rankings
    const allClubs = await tx.club.findMany({
      include: {
        rankings: { select: { points: true } },
        globalRank: true,
      },
    })

    const clubScores = allClubs.map((club) => {
      const playerScores = club.rankings.map((r) => r.points)
      const totalPoints = calculateClubTotalPoints(playerScores)
      const momentum = calculateMomentumScore(
        club.globalRank?.wins ?? 0,
        club.globalRank?.losses ?? 0
      )
      const activityBonus = club.rankings.length * 5 // Active players bonus
      
      return {
        clubId: club.id,
        totalPoints,
        momentum,
        activityBonus,
        finalScore: calculateClubFinalScore(totalPoints, momentum, activityBonus),
        currentPos: club.globalRank?.rankPosition ?? 999,
        wins: club.globalRank?.wins ?? 0,
        losses: club.globalRank?.losses ?? 0,
        draws: club.globalRank?.draws ?? 0,
      }
    })

    clubScores.sort((a, b) => b.finalScore - a.finalScore)

    for (let i = 0; i < clubScores.length; i++) {
      const score = clubScores[i]
      await tx.globalClubRanking.upsert({
        where: { clubId: score.clubId },
        update: {
          rankPosition: i + 1,
          prevPosition: score.currentPos,
          totalPoints: score.finalScore,
          wins: score.wins,
          losses: score.losses,
          draws: score.draws,
          momentum: score.momentum,
        },
        create: {
          clubId: score.clubId,
          rankPosition: i + 1,
          prevPosition: 0,
          totalPoints: score.finalScore,
          wins: score.wins,
          losses: score.losses,
          draws: score.draws,
          momentum: score.momentum,
        },
      })
    }
  })
}

// ─── Rank Change Helper ─────────────────────────────────────────────────────

export function getRankChangeDisplay(current: number, previous: number | null): {
  symbol: string
  color: string
  text: string
} {
  if (previous === null) return { symbol: "NEW", color: "text-[#ffb800]", text: "New Entry" }
  
  const change = previous - current
  if (change > 0) return { symbol: "▲", color: "text-[#00ff85]", text: `+${change}` }
  if (change < 0) return { symbol: "▼", color: "text-red-400", text: `${change}` }
  return { symbol: "—", color: "text-white/40", text: "Stable" }
}
