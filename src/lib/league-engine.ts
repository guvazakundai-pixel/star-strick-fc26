export type LeagueSettings = {
  rounds: number
  homeAway: boolean
  pointsForWin: number
  pointsForDraw: number
  maxPlayers: number
  autoFixtureGeneration: boolean
}

export const DEFAULT_LEAGUE_SETTINGS: LeagueSettings = {
  rounds: 2,
  homeAway: true,
  pointsForWin: 3,
  pointsForDraw: 1,
  maxPlayers: 16,
  autoFixtureGeneration: true,
}

export type StandingRow = {
  userId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  points: number
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  form: string
  cleanSheets: number
}

export function generateRoundRobin(playerIds: string[], homeAway: boolean = true) {
  const ids = [...playerIds]
  const fixtures: { home: string; away: string; matchday: number }[] = []

  if (ids.length < 2) return fixtures

  if (ids.length % 2 !== 0) ids.push("BYE")

  const n = ids.length
  const rounds = n - 1
  const half = n / 2
  let matchday = 1

  const rotating = ids.slice(1)
  let fixed = ids[0]

  for (let r = 0; r < rounds; r++) {
    const pairs: [string, string][] = []
    pairs.push([fixed, rotating[0]])

    for (let i = 1; i < half; i++) {
      pairs.push([rotating[n - 2 - i + 1], rotating[i]])
    }

    for (const [home, away] of pairs) {
      if (home === "BYE" || away === "BYE") continue
      if (r % 2 === 0) {
        fixtures.push({ home, away, matchday })
      } else {
        fixtures.push({ home: away, away: home, matchday })
      }
    }

    rotating.push(rotating.shift()!)
    matchday++
  }

  if (homeAway) {
    const returnFixtures: typeof fixtures = []
    const maxMatchday = matchday - 1
    for (const f of fixtures) {
      returnFixtures.push({
        home: f.away,
        away: f.home,
        matchday: f.matchday + maxMatchday,
      })
    }
    fixtures.push(...returnFixtures)
  }

  return fixtures
}

export function computeStandings(
  participants: {
    userId: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    points: number
    played: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
    goalDifference: number
    form: string
    cleanSheets: number
  }[],
  fixtures: {
    homePlayerId: string
    awayPlayerId: string
    homeScore: number | null
    awayScore: number | null
    status: string
  }[],
): StandingRow[] {
  const map = new Map<string, StandingRow>()

  for (const p of participants) {
    map.set(p.userId, { ...p })
  }

  for (const f of fixtures) {
    if (f.status !== "CONFIRMED" && f.status !== "PLAYED") continue
    if (f.homeScore === null || f.awayScore === null) continue

    const home = map.get(f.homePlayerId)
    const away = map.get(f.awayPlayerId)
    if (!home || !away) continue

    home.played++
    away.played++

    if (f.homeScore > f.awayScore) {
      home.wins++
      home.points += 3
      away.losses++
      away.form = (away.form + "L").slice(-5)
      if (f.awayScore === 0) home.cleanSheets++
      home.form = (home.form + "W").slice(-5)
    } else if (f.homeScore < f.awayScore) {
      away.wins++
      away.points += 3
      home.losses++
      home.form = (home.form + "L").slice(-5)
      if (f.homeScore === 0) away.cleanSheets++
      away.form = (away.form + "W").slice(-5)
    } else {
      home.draws++
      away.draws++
      home.points += 1
      away.points += 1
      home.form = (home.form + "D").slice(-5)
      away.form = (away.form + "D").slice(-5)
    }

    home.goalsFor += f.homeScore
    home.goalsAgainst += f.awayScore
    away.goalsFor += f.awayScore
    away.goalsAgainst += f.homeScore
    home.goalDifference = home.goalsFor - home.goalsAgainst
    away.goalDifference = away.goalsFor - away.goalsAgainst
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return b.wins - a.wins
  })
}

export function computeHeadToHead(
  standings: StandingRow[],
  fixtures: { homePlayerId: string; awayPlayerId: string; homeScore: number | null; awayScore: number | null; status: string }[],
  playerAId: string,
  playerBId: string,
): { aWins: number; bWins: number; draws: number; aPoints: number } {
  let aWins = 0, bWins = 0, draws = 0, aPoints = 0

  for (const f of fixtures) {
    if (f.status !== "CONFIRMED" && f.status !== "PLAYED") continue
    if (f.homeScore === null || f.awayScore === null) continue

    const isA = f.homePlayerId === playerAId || f.awayPlayerId === playerAId
    const isB = f.homePlayerId === playerBId || f.awayPlayerId === playerBId
    if (!isA || !isB) continue

    const aScore = f.homePlayerId === playerAId ? f.homeScore : f.awayScore
    const bScore = f.awayPlayerId === playerBId ? f.awayScore : f.homeScore

    if (aScore > bScore) { aWins++; aPoints += 3 }
    else if (aScore < bScore) { bWins++ }
    else { draws++; aPoints += 1 }
  }

  return { aWins, bWins, draws, aPoints }
}

export function validateFixtureResult(homeScore: number, awayScore: number): string | null {
  if (homeScore < 0 || awayScore < 0) return "Scores cannot be negative"
  if (homeScore > 50 || awayScore > 50) return "Scores cannot exceed 50"
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) return "Scores must be whole numbers"
  return null
}

export function generateInviteCode(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
