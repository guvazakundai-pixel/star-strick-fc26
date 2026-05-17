export type LeagueFixtureInput = {
  leagueId: string;
  seasonId: string;
  matchday: number;
  homeUserId: string;
  awayUserId: string;
};

export type FixtureData = {
  homeUserId: string;
  awayUserId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

export type StandingEntry = {
  userId: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string;
};

export function generateRoundRobinFixtures(
  leagueId: string,
  seasonId: string,
  participantIds: string[],
  rounds: number = 2,
  homeAway: boolean = true
): LeagueFixtureInput[] {
  const n = participantIds.length;
  if (n < 2) return [];

  const ids = [...participantIds];
  if (n % 2 !== 0) {
    ids.push("__BYE__");
  }
  const m = ids.length;
  const totalRounds = m - 1;
  const fixtures: LeagueFixtureInput[] = [];

  const fixed = ids[0];
  const rotatable = ids.slice(1);

  for (let round = 0; round < totalRounds; round++) {
    const matchday = round + 1;
    const pairs: [string, string][] = [];

    pairs.push([fixed, rotatable[0]]);

    for (let i = 1; i < m / 2; i++) {
      pairs.push([rotatable[i], rotatable[m - 1 - i]]);
    }

    for (const [home, away] of pairs) {
      if (home === "__BYE__" || away === "__BYE__") continue;
      fixtures.push({ leagueId, seasonId, matchday, homeUserId: home, awayUserId: away });
    }

    rotatable.unshift(rotatable.pop()!);
  }

  if (homeAway && rounds >= 2) {
    const reversed = fixtures.map((f) => ({
      ...f,
      matchday: f.matchday + totalRounds,
      homeUserId: f.awayUserId,
      awayUserId: f.homeUserId,
    }));
    fixtures.push(...reversed);
  }

  return fixtures;
}

export function calculateStandings(fixtures: FixtureData[]): StandingEntry[] {
  const map = new Map<string, StandingEntry>();

  const init = (userId: string): StandingEntry => ({
    userId,
    points: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    form: "",
  });

  for (const f of fixtures) {
    if (f.status !== "COMPLETED" || f.homeScore === null || f.awayScore === null) continue;

    const h = map.get(f.homeUserId) ?? init(f.homeUserId);
    const a = map.get(f.awayUserId) ?? init(f.awayUserId);

    h.played++;
    a.played++;
    h.goalsFor += f.homeScore;
    h.goalsAgainst += f.awayScore;
    a.goalsFor += f.awayScore;
    a.goalsAgainst += f.homeScore;

    if (f.homeScore > f.awayScore) {
      h.wins++;
      h.points += 3;
      a.losses++;
      h.form = getFormString(h.form, "W");
      a.form = getFormString(a.form, "L");
    } else if (f.homeScore < f.awayScore) {
      a.wins++;
      a.points += 3;
      h.losses++;
      h.form = getFormString(h.form, "L");
      a.form = getFormString(a.form, "W");
    } else {
      h.draws++;
      a.draws++;
      h.points += 1;
      a.points += 1;
      h.form = getFormString(h.form, "D");
      a.form = getFormString(a.form, "D");
    }

    h.goalDifference = h.goalsFor - h.goalsAgainst;
    a.goalDifference = a.goalsFor - a.goalsAgainst;

    map.set(f.homeUserId, h);
    map.set(f.awayUserId, a);
  }

  const entries = Array.from(map.values());

  entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    const h2h = resolveHeadToHead(entries, fixtures);
    if (h2h) return h2h;
    return b.wins - a.wins;
  });

  return entries;
}

function resolveHeadToHead(entries: StandingEntry[], fixtures: FixtureData[]): number | null {
  if (entries.length < 2) return null;
  const [a, b] = entries;
  let aPts = 0;
  let bPts = 0;
  for (const f of fixtures) {
    if (f.status !== "COMPLETED" || f.homeScore === null || f.awayScore === null) continue;
    if (f.homeUserId === a.userId && f.awayUserId === b.userId) {
      if (f.homeScore > f.awayScore) aPts += 3;
      else if (f.homeScore < f.awayScore) bPts += 3;
      else { aPts += 1; bPts += 1; }
    }
    if (f.homeUserId === b.userId && f.awayUserId === a.userId) {
      if (f.homeScore > f.awayScore) bPts += 3;
      else if (f.homeScore < f.awayScore) aPts += 3;
      else { aPts += 1; bPts += 1; }
    }
  }
  if (aPts === bPts) return null;
  return bPts - aPts;
}

export function getFormString(existingForm: string, result: "W" | "D" | "L"): string {
  const updated = (existingForm + result).slice(-5);
  return updated;
}

export async function updateStandingsFromFixture(
  prisma: any,
  leagueId: string,
  seasonId: string,
  fixture: { homeUserId: string; awayUserId: string; homeScore: number; awayScore: number }
): Promise<void> {
  const userIds = [fixture.homeUserId, fixture.awayUserId];

  const standings = await prisma.leagueStanding.findMany({
    where: { leagueId, seasonId, userId: { in: userIds } },
  });

  for (const userId of userIds) {
    const isHome = userId === fixture.homeUserId;
    const scored = isHome ? fixture.homeScore : fixture.awayScore;
    const conceded = isHome ? fixture.awayScore : fixture.homeScore;
    let existing = standings.find((s: any) => s.userId === userId);

    const data: Record<string, any> = {
      played: (existing?.played ?? 0) + 1,
      goalsFor: (existing?.goalsFor ?? 0) + scored,
      goalsAgainst: (existing?.goalsAgainst ?? 0) + conceded,
      goalDifference: 0,
      points: existing?.points ?? 0,
      wins: existing?.wins ?? 0,
      draws: existing?.draws ?? 0,
      losses: existing?.losses ?? 0,
      form: existing?.form ?? "",
    };

    let result: "W" | "D" | "L";
    if (scored > conceded) {
      data.wins++;
      data.points += 3;
      result = "W";
    } else if (scored < conceded) {
      data.losses++;
      result = "L";
    } else {
      data.draws++;
      data.points += 1;
      result = "D";
    }

    data.goalDifference = data.goalsFor - data.goalsAgainst;
    data.form = getFormString(data.form, result);

    if (existing) {
      await prisma.leagueStanding.update({ where: { id: existing.id }, data });
    } else {
      await prisma.leagueStanding.create({
        data: {
          leagueId,
          seasonId,
          userId,
          ...data,
        },
      });
    }
  }
}
