export type AuthenticatedFixture = {
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  authenticatedAt: Date;
};

export type StandingRow = {
  userId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: string;
  position: number;
};

/**
 * Build a standings table from a list of authenticated fixtures.
 * Pure function — given the same inputs, returns the same output.
 * Form is the last 5 results (most recent first) as W/D/L characters.
 */
export function buildStandings(
  participantIds: string[],
  fixtures: AuthenticatedFixture[],
): StandingRow[] {
  const table = new Map<string, Omit<StandingRow, "position" | "form"> & { results: { at: Date; outcome: "W" | "D" | "L" }[] }>();

  for (const id of participantIds) {
    table.set(id, {
      userId: id,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      results: [],
    });
  }

  for (const f of fixtures) {
    const home = table.get(f.homeId);
    const away = table.get(f.awayId);
    if (!home || !away) continue;

    home.played++; away.played++;
    home.goalsFor += f.homeScore; home.goalsAgainst += f.awayScore;
    away.goalsFor += f.awayScore; away.goalsAgainst += f.homeScore;

    if (f.homeScore > f.awayScore) {
      home.wins++; home.points += 3; home.results.push({ at: f.authenticatedAt, outcome: "W" });
      away.losses++; away.results.push({ at: f.authenticatedAt, outcome: "L" });
    } else if (f.homeScore < f.awayScore) {
      away.wins++; away.points += 3; away.results.push({ at: f.authenticatedAt, outcome: "W" });
      home.losses++; home.results.push({ at: f.authenticatedAt, outcome: "L" });
    } else {
      home.draws++; home.points++; home.results.push({ at: f.authenticatedAt, outcome: "D" });
      away.draws++; away.points++; away.results.push({ at: f.authenticatedAt, outcome: "D" });
    }
  }

  const rows = [...table.values()].map((r) => {
    const form = r.results
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 5)
      .map((x) => x.outcome)
      .join("");
    return {
      userId: r.userId,
      played: r.played,
      wins: r.wins,
      draws: r.draws,
      losses: r.losses,
      goalsFor: r.goalsFor,
      goalsAgainst: r.goalsAgainst,
      points: r.points,
      form,
    };
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.userId.localeCompare(b.userId);
  });

  return rows.map((r, i) => ({ ...r, position: i + 1 }));
}
