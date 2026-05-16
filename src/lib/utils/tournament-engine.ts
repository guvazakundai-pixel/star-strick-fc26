import type { BracketNode } from '@/types';
import { generateBracketId } from './generate';

export function generateKnockoutBracket(playerIds: string[]): BracketNode[][] {
  const numPlayers = playerIds.length;
  const numRounds = Math.ceil(Math.log2(numPlayers));
  const totalSlots = Math.pow(2, numRounds);
  const bracket: BracketNode[][] = [];
  const seeded = seedPlayers(playerIds);
  const padded = padWithByes(seeded, totalSlots);

  const firstRound: BracketNode[] = [];
  for (let i = 0; i < totalSlots; i += 2) {
    const pos = i / 2;
    firstRound.push({ id: generateBracketId(1, pos), round: 1, position: pos, homePlayerId: padded[i] || undefined, awayPlayerId: padded[i + 1] || undefined, status: 'SCHEDULED' });
  }
  bracket.push(firstRound);

  for (let round = 2; round <= numRounds; round++) {
    const matchesInRound = totalSlots / Math.pow(2, round);
    const roundMatches: BracketNode[] = [];
    for (let pos = 0; pos < matchesInRound; pos++) {
      roundMatches.push({ id: generateBracketId(round, pos), round, position: pos, status: 'SCHEDULED' });
    }
    bracket.push(roundMatches);
  }
  return bracket;
}

function seedPlayers(players: string[]): string[] {
  const sorted = [...players].sort(() => Math.random() - 0.5);
  const seeded: string[] = [];
  let i = 0, j = sorted.length - 1;
  while (i <= j) {
    if (i === j) { seeded.push(sorted[i]); break; }
    seeded.push(sorted[i]); seeded.push(sorted[j]); i++; j--;
  }
  return seeded;
}

function padWithByes(players: string[], totalSlots: number): (string | null)[] {
  const padded: (string | null)[] = [...players];
  while (padded.length < totalSlots) padded.push(null);
  return padded;
}

export function generateGroupStage(playerIds: string[], groupSize = 4): Array<{ name: string; players: string[] }> {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const numGroups = Math.ceil(shuffled.length / groupSize);
  const groups: Array<{ name: string; players: string[] }> = [];
  const names = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < numGroups; i++) {
    groups.push({ name: names[i], players: shuffled.slice(i * groupSize, (i + 1) * groupSize) });
  }
  return groups;
}
