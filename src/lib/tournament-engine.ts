export type TournamentFormat = "KNOCKOUT" | "ROUND_ROBIN" | "GROUPS";

export type StandingInput = {
  teamId: string;
  teamName?: string;
  assignedTeam?: string | null;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  headToHeadRecords?: Record<string, { points: number; goalsFor: number; goalsAgainst: number }>;
};

export type FixtureInput = {
  homeUserId: string;
  awayUserId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

export function calcPerformanceIndex(team: StandingInput): number {
  if (team.matchesPlayed === 0) return 0;
  const winRate = team.wins / team.matchesPlayed;
  return winRate * 10000 + team.goalsFor * 100 - team.goalsAgainst * 10;
}

export function sortStandings(standings: StandingInput[]): StandingInput[] {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;

    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;

    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

    const h2hA = a.headToHeadRecords?.[b.teamId]?.points ?? 0;
    const h2hB = b.headToHeadRecords?.[a.teamId]?.points ?? 0;
    if (h2hB !== h2hA) return h2hB - h2hA;

    return calcPerformanceIndex(b) - calcPerformanceIndex(a);
  });
}

export function sortGroupStandingsFromFixtures(
  userIds: string[],
  fixtures: FixtureInput[]
): StandingInput[] {
  const map = new Map<string, StandingInput>();
  for (const uid of userIds) {
    map.set(uid, {
      teamId: uid,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      headToHeadRecords: {},
    });
  }

  for (const f of fixtures) {
    if (f.status !== "COMPLETED" || f.homeScore === null || f.awayScore === null) continue;

    const h = map.get(f.homeUserId);
    const a = map.get(f.awayUserId);
    if (!h || !a) continue;

    h.matchesPlayed++;
    a.matchesPlayed++;
    h.goalsFor += f.homeScore;
    h.goalsAgainst += f.awayScore;
    a.goalsFor += f.awayScore;
    a.goalsAgainst += f.homeScore;

    if (!h.headToHeadRecords) h.headToHeadRecords = {};
    if (!a.headToHeadRecords) a.headToHeadRecords = {};
    if (!h.headToHeadRecords[f.awayUserId]) h.headToHeadRecords[f.awayUserId] = { points: 0, goalsFor: 0, goalsAgainst: 0 };
    if (!a.headToHeadRecords[f.homeUserId]) a.headToHeadRecords[f.homeUserId] = { points: 0, goalsFor: 0, goalsAgainst: 0 };

    if (f.homeScore > f.awayScore) {
      h.wins++;
      h.points += 3;
      a.losses++;
      h.headToHeadRecords[f.awayUserId].points += 3;
      h.headToHeadRecords[f.awayUserId].goalsFor += f.homeScore;
      h.headToHeadRecords[f.awayUserId].goalsAgainst += f.awayScore;
      a.headToHeadRecords[f.homeUserId].goalsFor += f.awayScore;
      a.headToHeadRecords[f.homeUserId].goalsAgainst += f.homeScore;
    } else if (f.homeScore < f.awayScore) {
      a.wins++;
      a.points += 3;
      h.losses++;
      a.headToHeadRecords[f.homeUserId].points += 3;
      a.headToHeadRecords[f.homeUserId].goalsFor += f.awayScore;
      a.headToHeadRecords[f.homeUserId].goalsAgainst += f.homeScore;
      h.headToHeadRecords[f.awayUserId].goalsFor += f.homeScore;
      h.headToHeadRecords[f.awayUserId].goalsAgainst += f.awayScore;
    } else {
      h.draws++;
      a.draws++;
      h.points += 1;
      a.points += 1;
      h.headToHeadRecords[f.awayUserId].points += 1;
      a.headToHeadRecords[f.homeUserId].points += 1;
      h.headToHeadRecords[f.awayUserId].goalsFor += f.homeScore;
      h.headToHeadRecords[f.awayUserId].goalsAgainst += f.awayScore;
      a.headToHeadRecords[f.homeUserId].goalsFor += f.awayScore;
      a.headToHeadRecords[f.homeUserId].goalsAgainst += f.homeScore;
    }
  }

  return sortStandings(Array.from(map.values()));
}

export function generateGroupStage(
  participantIds: string[],
  groupSize: number = 4
): { name: string; userIds: string[] }[] {
  const shuffled = [...participantIds].sort(() => Math.random() - 0.5);
  const groups: { name: string; userIds: string[] }[] = [];
  const groupLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let idx = 0;

  while (idx < shuffled.length) {
    const slice = shuffled.slice(idx, idx + groupSize);
    const letter = groupLetters[groups.length] || `Group ${groups.length + 1}`;
    groups.push({ name: `Group ${letter}`, userIds: slice });
    idx += groupSize;
  }

  return groups;
}

export function generateGroupFixtures(
  tournamentId: string,
  groupId: string,
  userIds: string[]
): { homeUserId: string; awayUserId: string; round: number; matchIndex: number }[] {
  const fixtures: { homeUserId: string; awayUserId: string; round: number; matchIndex: number }[] = [];
  const n = userIds.length;
  if (n < 2) return fixtures;

  const ids = [...userIds];
  if (n % 2 !== 0) ids.push("__BYE__");
  const m = ids.length;
  const totalRounds = m - 1;
  const fixed = ids[0];
  const rotatable = ids.slice(1);

  for (let round = 0; round < totalRounds; round++) {
    const pairs: [string, string][] = [];
    pairs.push([fixed, rotatable[0]]);
    for (let i = 1; i < m / 2; i++) {
      pairs.push([rotatable[i], rotatable[m - 1 - i]]);
    }
    for (const [home, away] of pairs) {
      if (home === "__BYE__" || away === "__BYE__") continue;
      fixtures.push({ homeUserId: home, awayUserId: away, round: round + 1, matchIndex: fixtures.length });
    }
    rotatable.unshift(rotatable.pop()!);
  }

  return fixtures;
}

export function generateKnockoutBracket(
  tournamentId: string,
  participantIds: string[],
  seeded: boolean = true
): {
  homeUserId: string | null;
  awayUserId: string | null;
  round: number;
  matchIndex: number;
}[] {
  const size = seeded ? nextPowerOf2(participantIds.length) : participantIds.length;
  const byes = size - participantIds.length;
  const ordered = seeded ? seedOrder(size, participantIds) : participantIds;
  const matches: { homeUserId: string | null; awayUserId: string | null; round: number; matchIndex: number }[] = [];

  for (let i = 0; i < size; i += 2) {
    const home = ordered[i] ?? null;
    const away = ordered[i + 1] ?? null;
    matches.push({ homeUserId: home, awayUserId: away, round: 1, matchIndex: i / 2 });
  }

  let roundMatches = matches.length;
  let roundNum = 2;
  while (roundMatches > 1) {
    for (let i = 0; i < roundMatches; i++) {
      matches.push({ homeUserId: null, awayUserId: null, round: roundNum, matchIndex: i });
    }
    roundMatches = Math.ceil(roundMatches / 2);
    roundNum++;
  }

  return matches;
}

export function advanceFromGroupStage(
  groups: { name: string; standings: StandingInput[] }[],
  advancersPerGroup: number = 2
): { userId: string; seed: number }[] {
  const advancers: { userId: string; seed: number }[] = [];
  let seed = 1;

  for (const group of groups) {
    const sorted = sortStandings(group.standings);
    const top = sorted.slice(0, advancersPerGroup);
    for (const t of top) {
      advancers.push({ userId: t.teamId, seed: seed++ });
    }
  }

  return advancers;
}

export function getFormString(existing: string, result: "W" | "D" | "L"): string {
  return (existing + result).slice(-5);
}

function nextPowerOf2(n: number): number {
  if (n <= 1) return 2;
  let p = 2;
  while (p < n) p *= 2;
  return p;
}

function seedOrder(size: number, participants: string[]): (string | null)[] {
  const result: (string | null)[] = new Array(size).fill(null);
  const seeds = generateSeeds(size);
  for (let i = 0; i < Math.min(participants.length, seeds.length); i++) {
    result[seeds[i]] = participants[i];
  }
  return result;
}

function generateSeeds(size: number): number[] {
  if (size <= 2) return [0, 1];
  const half = size / 2;
  const left = generateSeeds(half);
  const right = left.map((s) => s + half);
  const merged: number[] = [];
  for (let i = 0; i < half; i++) {
    merged.push(left[i], right[i]);
  }
  return merged;
}
