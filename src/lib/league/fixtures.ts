export type FixturePair = {
  matchday: number;
  homeId: string;
  awayId: string;
};

/**
 * Generate round-robin fixtures using the circle method.
 * If doubleRoundRobin is true, generates a reverse leg with home/away swapped.
 * Handles odd player counts by inserting a bye (those rounds drop the bye fixture).
 */
export function generateRoundRobin(
  playerIds: string[],
  options: { doubleRoundRobin?: boolean } = {},
): FixturePair[] {
  const players = [...playerIds];
  const hasOdd = players.length % 2 === 1;
  if (hasOdd) players.push("__BYE__");

  const n = players.length;
  const rounds = n - 1;
  const half = n / 2;
  const fixtures: FixturePair[] = [];

  const fixed = players[0];
  let rotating = players.slice(1);

  for (let round = 0; round < rounds; round++) {
    const lineup = [fixed, ...rotating];
    for (let i = 0; i < half; i++) {
      const a = lineup[i];
      const b = lineup[n - 1 - i];
      if (a === "__BYE__" || b === "__BYE__") continue;
      const homeFirst = (round + i) % 2 === 0;
      fixtures.push({
        matchday: round + 1,
        homeId: homeFirst ? a : b,
        awayId: homeFirst ? b : a,
      });
    }
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }

  if (options.doubleRoundRobin) {
    const offset = rounds;
    const reverse = fixtures.map((f) => ({
      matchday: f.matchday + offset,
      homeId: f.awayId,
      awayId: f.homeId,
    }));
    return [...fixtures, ...reverse];
  }

  return fixtures;
}
