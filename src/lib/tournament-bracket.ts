export type BracketMatch = {
  id: string;
  round: number;
  position: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  score1: number | null;
  score2: number | null;
  status: "PENDING" | "READY" | "LIVE" | "COMPLETED";
};

export type Bracket = {
  rounds: BracketMatch[][];
  totalRounds: number;
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateBracket(
  tournamentId: string,
  playerIds: string[],
  type: string,
): Bracket {
  const shuffled = shuffle(playerIds);
  const count = shuffled.length;

  if (type === "ROUND_ROBIN") {
    const matches: BracketMatch[] = [];
    let pos = 0;
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        matches.push({
          id: `${tournamentId}-rr-${i}-${j}`,
          round: 1,
          position: pos++,
          player1Id: shuffled[i],
          player2Id: shuffled[j],
          winnerId: null,
          score1: null,
          score2: null,
          status: "READY",
        });
      }
    }
    return { rounds: [matches], totalRounds: 1 };
  }

  // Knockout bracket
  const totalRounds = Math.ceil(Math.log2(count));
  const bracketSize = Math.pow(2, totalRounds);
  const byes = bracketSize - count;

  const rounds: BracketMatch[][] = [];

  // First round
  const firstRound: BracketMatch[] = [];
  let idx = 0;
  for (let pos = 0; pos < bracketSize / 2; pos++) {
    const p1 = idx < count ? shuffled[idx++] : null;
    const p2 = idx < count ? shuffled[idx++] : null;
    const isBye = !p1 || !p2;
    firstRound.push({
      id: `${tournamentId}-r1-${pos}`,
      round: 1,
      position: pos,
      player1Id: p1,
      player2Id: p2,
      winnerId: isBye ? (p1 ?? p2) : null,
      score1: null,
      score2: null,
      status: isBye ? "COMPLETED" : p1 && p2 ? "READY" : "PENDING",
    });
  }
  rounds.push(firstRound);

  // Subsequent rounds
  for (let r = 2; r <= totalRounds; r++) {
    const matchCount = Math.pow(2, totalRounds - r);
    const round: BracketMatch[] = [];
    for (let pos = 0; pos < matchCount; pos++) {
      round.push({
        id: `${tournamentId}-r${r}-${pos}`,
        round: r,
        position: pos,
        player1Id: null,
        player2Id: null,
        winnerId: null,
        score1: null,
        score2: null,
        status: "PENDING",
      });
    }
    rounds.push(round);
  }

  return { rounds, totalRounds };
}

export function advanceBracket(
  bracket: Bracket,
  matchId: string,
  winnerId: string,
  score1: number,
  score2: number,
): Bracket {
  const updated = structuredClone(bracket);

  for (let ri = 0; ri < updated.rounds.length; ri++) {
    const matchIdx = updated.rounds[ri].findIndex((m) => m.id === matchId);
    if (matchIdx === -1) continue;

    const match = updated.rounds[ri][matchIdx];
    match.winnerId = winnerId;
    match.score1 = score1;
    match.score2 = score2;
    match.status = "COMPLETED";

    // Advance winner to next round
    const nextRound = ri + 1;
    if (nextRound < updated.rounds.length) {
      const nextMatchIdx = Math.floor(matchIdx / 2);
      const nextMatch = updated.rounds[nextRound][nextMatchIdx];
      if (matchIdx % 2 === 0) {
        nextMatch.player1Id = winnerId;
      } else {
        nextMatch.player2Id = winnerId;
      }
      if (nextMatch.player1Id && nextMatch.player2Id) {
        nextMatch.status = "READY";
      }
    }

    break;
  }

  return updated;
}
