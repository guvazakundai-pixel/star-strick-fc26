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

export type GroupStanding = {
  playerId: string;
  pts: number;
  played: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
};

export type GroupData = {
  name: string;
  playerIds: string[];
  matches: BracketMatch[];
  standings: GroupStanding[];
};

export type DoubleElimBracket = {
  winnersBracket: Bracket;
  losersBracket: Bracket;
  grandFinal: BracketMatch | null;
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

export function generateGroupStage(
  tournamentId: string,
  participantIds: string[],
  groupCount: number,
): GroupData[] {
  const shuffled = shuffle(participantIds);
  const groups: GroupData[] = [];
  const perGroup = Math.ceil(shuffled.length / groupCount);

  for (let g = 0; g < groupCount; g++) {
    const name = String.fromCharCode(65 + g); // A, B, C...
    const playerIds = shuffled.slice(g * perGroup, (g + 1) * perGroup);
    if (playerIds.length < 2) continue;

    const matches: BracketMatch[] = [];
    let pos = 0;
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        matches.push({
          id: `${tournamentId}-g${name}-${i}-${j}`,
          round: 1,
          position: pos++,
          player1Id: playerIds[i],
          player2Id: playerIds[j],
          winnerId: null,
          score1: null,
          score2: null,
          status: "READY",
        });
      }
    }

    groups.push({
      name,
      playerIds,
      matches,
      standings: playerIds.map((pid) => ({
        playerId: pid,
        pts: 0, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0,
      })),
    });
  }

  return groups;
}

export function qualifyFromGroups(groups: GroupData[], qualifiedPerGroup: number): string[] {
  const qualified: string[] = [];
  for (const group of groups) {
    const sorted = [...group.standings].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return b.w - a.w;
    });
    qualified.push(...sorted.slice(0, qualifiedPerGroup).map((s) => s.playerId));
  }
  return qualified;
}

export function generateDoubleEliminationBracket(
  tournamentId: string,
  playerIds: string[],
): DoubleElimBracket {
  const shuffled = shuffle(playerIds);
  const count = shuffled.length;
  const totalRounds = Math.ceil(Math.log2(count));
  const bracketSize = Math.pow(2, totalRounds);

  const wbRounds: BracketMatch[][] = [];
  const lbRounds: BracketMatch[][] = [];

  // Winners bracket first round
  const wbFirst: BracketMatch[] = [];
  let idx = 0;
  for (let pos = 0; pos < bracketSize / 2; pos++) {
    const p1 = idx < count ? shuffled[idx++] : null;
    const p2 = idx < count ? shuffled[idx++] : null;
    const isBye = !p1 || !p2;
    wbFirst.push({
      id: `${tournamentId}-wb-r1-${pos}`,
      round: 1, position: pos,
      player1Id: p1, player2Id: p2,
      winnerId: isBye ? (p1 ?? p2) : null,
      score1: null, score2: null,
      status: isBye ? "COMPLETED" : p1 && p2 ? "READY" : "PENDING",
    });
  }
  wbRounds.push(wbFirst);

  // Subsequent winners rounds
  for (let r = 2; r <= totalRounds; r++) {
    const matchCount = Math.pow(2, totalRounds - r);
    const round: BracketMatch[] = [];
    for (let pos = 0; pos < matchCount; pos++) {
      round.push({
        id: `${tournamentId}-wb-r${r}-${pos}`,
        round: r, position: pos,
        player1Id: null, player2Id: null,
        winnerId: null, score1: null, score2: null,
        status: "PENDING",
      });
    }
    wbRounds.push(round);
  }

  // Losers bracket rounds (totalRounds - 1 rounds for losers)
  for (let r = 1; r < totalRounds; r++) {
    const matchCount = Math.pow(2, totalRounds - r - 1);
    const round: BracketMatch[] = [];
    for (let pos = 0; pos < matchCount * 2; pos++) {
      round.push({
        id: `${tournamentId}-lb-r${r}-${pos}`,
        round: r, position: pos,
        player1Id: null, player2Id: null,
        winnerId: null, score1: null, score2: null,
        status: "PENDING",
      });
    }
    lbRounds.push(round);
  }

  return {
    winnersBracket: { rounds: wbRounds, totalRounds },
    losersBracket: { rounds: lbRounds, totalRounds: totalRounds - 1 },
    grandFinal: {
      id: `${tournamentId}-gf`,
      round: totalRounds + 1, position: 0,
      player1Id: null, player2Id: null,
      winnerId: null, score1: null, score2: null,
      status: "PENDING",
    },
  };
}

export function advanceDoubleElimBracket(
  bracket: DoubleElimBracket,
  matchId: string,
  winnerId: string,
  score1: number,
  score2: number,
  isWinnersBracket: boolean,
): DoubleElimBracket {
  const updated = structuredClone(bracket);
  const bracketToUse = isWinnersBracket ? updated.winnersBracket : updated.losersBracket;

  for (let ri = 0; ri < bracketToUse.rounds.length; ri++) {
    const matchIdx = bracketToUse.rounds[ri].findIndex((m) => m.id === matchId);
    if (matchIdx === -1) continue;

    const match = bracketToUse.rounds[ri][matchIdx];
    const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
    match.winnerId = winnerId;
    match.score1 = score1;
    match.score2 = score2;
    match.status = "COMPLETED";

    if (isWinnersBracket) {
      // Advance winner in winners bracket
      const nextRound = ri + 1;
      if (nextRound < updated.winnersBracket.rounds.length) {
        const nextMatchIdx = Math.floor(matchIdx / 2);
        const nextMatch = updated.winnersBracket.rounds[nextRound][nextMatchIdx];
        if (matchIdx % 2 === 0) {
          nextMatch.player1Id = winnerId;
        } else {
          nextMatch.player2Id = winnerId;
        }
        if (nextMatch.player1Id && nextMatch.player2Id) {
          nextMatch.status = "READY";
        }
      }

      // Send loser to losers bracket
      if (loserId && ri < updated.losersBracket.rounds.length) {
        const lbRound = updated.losersBracket.rounds[ri];
        const lbMatch = lbRound.find((m) => !m.player1Id || !m.player2Id);
        if (lbMatch) {
          if (!lbMatch.player1Id) lbMatch.player1Id = loserId;
          else lbMatch.player2Id = loserId;
          if (lbMatch.player1Id && lbMatch.player2Id) lbMatch.status = "READY";
        }
      }

      // If last winners round, winner goes to grand final
      if (nextRound >= updated.winnersBracket.totalRounds && updated.grandFinal) {
        if (!updated.grandFinal.player1Id) updated.grandFinal.player1Id = winnerId;
        else updated.grandFinal.player2Id = winnerId;
        if (updated.grandFinal.player1Id && updated.grandFinal.player2Id) {
          updated.grandFinal.status = "READY";
        }
      }
    } else {
      // Losers bracket - winner advances, loser eliminated
      const nextRound = ri + 1;
      if (nextRound < updated.losersBracket.rounds.length) {
        const nextMatchIdx = Math.floor(matchIdx / 2);
        const nextMatch = updated.losersBracket.rounds[nextRound][nextMatchIdx];
        if (matchIdx % 2 === 0) {
          nextMatch.player1Id = winnerId;
        } else {
          nextMatch.player2Id = winnerId;
        }
        if (nextMatch.player1Id && nextMatch.player2Id) {
          nextMatch.status = "READY";
        }
      }

      // Last losers round winner goes to grand final
      if (ri >= updated.losersBracket.totalRounds - 1 && updated.grandFinal) {
        if (!updated.grandFinal.player2Id) updated.grandFinal.player2Id = winnerId;
        else updated.grandFinal.player1Id = winnerId;
        if (updated.grandFinal.player1Id && updated.grandFinal.player2Id) {
          updated.grandFinal.status = "READY";
        }
      }
    }

    break;
  }

  return updated;
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
