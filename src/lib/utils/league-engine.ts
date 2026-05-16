import type { LeagueStanding } from '@/types';

export function generateRoundRobinFixtures(
  playerIds: string[], rounds = 2, homeAway = true
): Array<{ homePlayerId: string; awayPlayerId: string; matchday: number }> {
  const fixtures: Array<{ homePlayerId: string; awayPlayerId: string; matchday: number }> = [];
  const players = [...playerIds];
  if (players.length < 2) return fixtures;
  if (players.length % 2 !== 0) players.push('BYE');
  const numRounds = homeAway ? rounds * (players.length - 1) : players.length - 1;
  const half = players.length / 2;
  let matchday = 1;

  for (let round = 0; round < numRounds; round++) {
    for (let match = 0; match < half; match++) {
      const home = players[match];
      const away = players[players.length - 1 - match];
      if (home !== 'BYE' && away !== 'BYE') {
        fixtures.push({ homePlayerId: round % 2 === 0 ? home : away, awayPlayerId: round % 2 === 0 ? away : home, matchday });
      }
    }
    const last = players.pop()!;
    players.splice(1, 0, last);
    matchday++;
  }
  return fixtures;
}

export function calculateLeagueStandings(
  existing: LeagueStanding[], homePlayerId: string, awayPlayerId: string, homeScore: number, awayScore: number
): LeagueStanding[] {
  const map = new Map<string, LeagueStanding>();
  existing.forEach((s) => map.set(s.playerId, { ...s }));

  for (const id of [homePlayerId, awayPlayerId]) {
    if (!map.has(id)) map.set(id, { playerId: id, points: 0, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, form: [], cleanSheets: 0 });
  }

  const home = map.get(homePlayerId)!;
  const away = map.get(awayPlayerId)!;
  home.played++; away.played++;
  home.goalsFor += homeScore; home.goalsAgainst += awayScore;
  away.goalsFor += awayScore; away.goalsAgainst += homeScore;
  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;

  if (homeScore > awayScore) {
    home.wins++; home.points += 3; away.losses++;
    home.form.push('W'); away.form.push('L');
    if (awayScore === 0) home.cleanSheets++;
  } else if (homeScore < awayScore) {
    away.wins++; away.points += 3; home.losses++;
    away.form.push('W'); home.form.push('L');
    if (homeScore === 0) away.cleanSheets++;
  } else {
    home.draws++; away.draws++; home.points += 1; away.points += 1;
    home.form.push('D'); away.form.push('D');
  }

  if (home.form.length > 5) home.form.shift();
  if (away.form.length > 5) away.form.shift();

  return Array.from(map.values());
}

export function sortStandings(standings: LeagueStanding[]): LeagueStanding[] {
  return standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return b.wins - a.wins;
  });
}
