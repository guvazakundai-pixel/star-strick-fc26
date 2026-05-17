import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

async function generateKnockoutBracket(tournamentId: string, participantIds: string[]) {
  const n = participantIds.length;
  if (n < 2) throw new Error("Need at least 2 participants");

  const size = nextPowerOf2(n);
  const totalRounds = Math.log2(size);
  const matches: { round: number; matchIndex: number; player1Id: string | null; player2Id: string | null; status: string }[] = [];

  const seeded = [...participantIds];
  while (seeded.length < size) seeded.push("");

  const seededOrder = seedBracket([...Array(size).keys()]);
  const round1Players = seededOrder.map((i) => seeded[i] || null);

  for (let i = 0; i < size / 2; i++) {
    const p1 = round1Players[i * 2] || null;
    const p2 = round1Players[i * 2 + 1] || null;
    const hasBye = !p1 || !p2;
    matches.push({
      round: 1,
      matchIndex: i,
      player1Id: p1,
      player2Id: p2,
      status: hasBye ? "PENDING" : (p1 && p2 ? "READY" : "PENDING"),
    });
  }

  for (let r = 2; r <= totalRounds; r++) {
    const matchesInRound = size / Math.pow(2, r);
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({ round: r, matchIndex: i, player1Id: null, player2Id: null, status: "PENDING" });
    }
  }

  for (const match of matches) {
    if (match.round === 1 && match.player1Id && !match.player2Id) {
      match.status = "COMPLETED";
      const nextRound = match.round + 1;
      const nextMatchIdx = Math.floor(match.matchIndex / 2);
      const nextMatch = matches.find((m) => m.round === nextRound && m.matchIndex === nextMatchIdx);
      if (nextMatch) {
        if (!nextMatch.player1Id) nextMatch.player1Id = match.player1Id;
        else nextMatch.player2Id = match.player1Id;
        if (nextMatch.player1Id && nextMatch.player2Id) nextMatch.status = "READY";
      }
    }
  }

  for (const m of matches) {
    await prisma.tournamentMatch.create({
      data: {
        tournamentId,
        round: m.round,
        matchIndex: m.matchIndex,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        status: m.status,
        winnerId: m.status === "COMPLETED" ? m.player1Id : null,
      },
    });
  }
}

function seedBracket(places: number[]): number[] {
  if (places.length <= 2) return places;
  const half = places.length / 2;
  const top = seedBracket(places.slice(0, half));
  const bottom = seedBracket(places.slice(half));
  const result: number[] = [];
  for (let i = 0; i < top.length; i++) {
    result.push(top[i], bottom[i]);
  }
  return result;
}

async function generateRoundRobin(tournamentId: string, participantIds: string[]) {
  const n = participantIds.length;
  if (n < 2) throw new Error("Need at least 2 participants");

  const players = [...participantIds];
  const hasBye = n % 2 !== 0;
  if (hasBye) players.push("");

  const totalRounds = players.length - 1;
  const matchesPerRound = Math.floor(players.length / 2);
  let matchIndex = 0;
  const fixed = players[0];
  const rotating = players.slice(1);

  for (let round = 1; round <= totalRounds; round++) {
    const roundPlayers = [fixed, ...rotating];
    for (let m = 0; m < matchesPerRound; m++) {
      const player1Id = roundPlayers[m] || null;
      const player2Id = roundPlayers[roundPlayers.length - 1 - m] || null;
      if (!player1Id || !player2Id) continue;
      await prisma.tournamentMatch.create({
        data: { tournamentId, round, matchIndex, player1Id, player2Id, status: "READY" },
      });
      matchIndex++;
    }
    const last = rotating.pop()!;
    rotating.unshift(last);
  }
}

// ─── GROUP STAGE ──────────────────────────────────────────────────

async function generateGroupStage(tournamentId: string, participantIds: string[], groupCount: number) {
  const n = participantIds.length;
  if (n < 2) throw new Error("Need at least 2 participants");

  const groupNames = "ABCDEFGH".slice(0, groupCount).split("").map((g) => `Group ${g}`);
  const groups: string[][] = Array.from({ length: groupCount }, () => []);

  // Snake-draft seeding: 1->A, 2->B, 3->C, 4->D, 5->D, 6->C, 7->B, 8->A ...
  participantIds.forEach((pid, i) => {
    const idx = i % groupCount;
    const reverse = Math.floor(i / groupCount) % 2 === 1;
    const slot = reverse ? groupCount - 1 - idx : idx;
    groups[slot].push(pid);
  });

  // Create TournamentGroup records + standings
  for (let g = 0; g < groupCount; g++) {
    const group = await prisma.tournamentGroup.create({
      data: {
        tournamentId,
        name: groupNames[g],
        seed: g,
      },
    });
    for (const userId of groups[g]) {
      await prisma.tournamentGroupStanding.create({
        data: {
          groupId: group.id,
          userId,
          points: 0,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
        },
      });
    }
  }

  // Generate intra-group round-robin matches
  let globalMatchIndex = 0;
  for (let g = 0; g < groupCount; g++) {
    const groupPlayers = groups[g];
    const group = await prisma.tournamentGroup.findFirst({
      where: { tournamentId, seed: g },
    });
    if (!group || groupPlayers.length < 2) continue;

    // Round-robin within the group
    const players = [...groupPlayers];
    const odd = players.length % 2 !== 0;
    if (odd) players.push("");
    const totalRounds = players.length - 1;
    const matchesPerRound = Math.floor(players.length / 2);
    const fixed = players[0];
    const rotating = players.slice(1);

    for (let round = 1; round <= totalRounds; round++) {
      const roundPlayers = [fixed, ...rotating];
      for (let m = 0; m < matchesPerRound; m++) {
        const p1 = roundPlayers[m];
        const p2 = roundPlayers[roundPlayers.length - 1 - m];
        if (!p1 || !p2) continue;
        await prisma.tournamentMatch.create({
          data: {
            tournamentId,
            round,
            matchIndex: globalMatchIndex,
            player1Id: p1,
            player2Id: p2,
            status: "READY",
            groupId: group.id,
          },
        });
        globalMatchIndex++;
      }
      const last = rotating.pop()!;
      rotating.unshift(last);
    }
  }
}

// ─── DOUBLE ELIMINATION ──────────────────────────────────────────

async function generateDoubleElimination(tournamentId: string, participantIds: string[]) {
  const n = participantIds.length;
  if (n < 2) throw new Error("Need at least 2 participants");

  const size = nextPowerOf2(n);
  const seeded = [...participantIds];
  while (seeded.length < size) seeded.push("");
  const seededOrder = seedBracket([...Array(size).keys()]);
  const round1Players = seededOrder.map((i) => seeded[i] || null);

  // Winners bracket: rounds 1..log2(size)
  const wbRounds = Math.log2(size);
  const allMatches: { bracket: "WB" | "LB"; round: number; matchIndex: number; player1Id: string | null; player2Id: string | null; status: string }[] = [];

  // Winners bracket R1
  for (let i = 0; i < size / 2; i++) {
    const p1 = round1Players[i * 2] || null;
    const p2 = round1Players[i * 2 + 1] || null;
    const hasBye = !p1 || !p2;
    allMatches.push({
      bracket: "WB",
      round: 1,
      matchIndex: i,
      player1Id: p1,
      player2Id: p2,
      status: hasBye ? "PENDING" : (p1 && p2 ? "READY" : "PENDING"),
    });
  }

  // Winners bracket subsequent rounds
  for (let r = 2; r <= wbRounds; r++) {
    const count = size / Math.pow(2, r);
    for (let i = 0; i < count; i++) {
      allMatches.push({ bracket: "WB", round: r, matchIndex: i, player1Id: null, player2Id: null, status: "PENDING" });
    }
  }

  // Losers bracket: for an 8-player DE, LB has rounds: LB1 (4 matches), LB2 (2 matches), LB3 (1 match), LB4 (1 match final)
  // General: for each WB round after R1, there's one LB round
  // LB gets players eliminated from WB R1 onward
  const lbRounds = wbRounds;
  // LB R1: size/4 matches (losers from WB R1)
  if (size >= 4) {
    let lbMatchIndex = 0;
    for (let lb = 1; lb < lbRounds; lb++) {
      const lbMatchCount = Math.pow(2, lb - 1);
      for (let i = 0; i < lbMatchCount; i++) {
        allMatches.push({
          bracket: "LB",
          round: wbRounds + lb,
          matchIndex: lbMatchIndex,
          player1Id: null,
          player2Id: null,
          status: "PENDING",
        });
        lbMatchIndex++;
      }
    }
    // LB final (to face WB winner)
    allMatches.push({
      bracket: "LB",
      round: wbRounds + lbRounds,
      matchIndex: 0,
      player1Id: null,
      player2Id: null,
      status: "PENDING",
    });
  }

  // Handle byes in WB R1
  for (const match of allMatches) {
    if (match.bracket === "WB" && match.round === 1 && match.player1Id && !match.player2Id) {
      match.status = "COMPLETED";
      const nxt = wbRounds >= 2 ? allMatches.find((m) => m.bracket === "WB" && m.round === 2 && m.matchIndex === Math.floor(match.matchIndex / 2)) : null;
      if (nxt) {
        if (!nxt.player1Id) nxt.player1Id = match.player1Id;
        else nxt.player2Id = match.player1Id;
        if (nxt.player1Id && nxt.player2Id) nxt.status = "READY";
      }
    }
  }

  // Create TournamentMatch records using nested-round encoding: bracket * 100 + round
  for (const m of allMatches) {
    const encodedRound = m.bracket === "WB" ? m.round : 50 + m.round;
    await prisma.tournamentMatch.create({
      data: {
        tournamentId,
        round: encodedRound,
        matchIndex: m.matchIndex,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        status: m.status,
        winnerId: m.status === "COMPLETED" ? m.player1Id : null,
        bracket: m.bracket,
      },
    });
  }
}

// ─── POST HANDLER ─────────────────────────────────────────────────

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      participants: {
        where: { status: { in: ["REGISTERED", "ACTIVE"] } },
        orderBy: { seed: "asc" },
      },
      matches: true,
    },
  });

  if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOrganizer = tournament.organizerId === auth.session.userId;
  const isAdmin = auth.session.role === "ADMIN";
  if (!isOrganizer && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (tournament.matches.length > 0) {
    return NextResponse.json({ error: "Bracket already generated" }, { status: 400 });
  }

  if (tournament.participants.length < 2) {
    return NextResponse.json({ error: "Need at least 2 participants" }, { status: 400 });
  }

  const participantIds = tournament.participants.map((p) => p.userId);

  try {
    switch (tournament.type) {
      case "KNOCKOUT":
        await generateKnockoutBracket(tournamentId, participantIds);
        break;
      case "ROUND_ROBIN":
        await generateRoundRobin(tournamentId, participantIds);
        break;
      case "GROUP_STAGE":
      case "GROUPS":
      case "HYBRID": {
        const groupCount = Math.min(8, Math.max(2, Math.floor(participantIds.length / 4)));
        await generateGroupStage(tournamentId, participantIds, groupCount);
        break;
      }
      case "DOUBLE_ELIM":
        await generateDoubleElimination(tournamentId, participantIds);
        break;
      default:
        return NextResponse.json({ error: `Unsupported type: ${tournament.type}` }, { status: 400 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bracket generation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "LIVE" },
  });

  await prisma.tournamentParticipant.updateMany({
    where: { tournamentId, status: "REGISTERED" },
    data: { status: "ACTIVE" },
  });

  const updated = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      matches: {
        include: {
          player1: { select: { id: true, username: true, displayName: true } },
          player2: { select: { id: true, username: true, displayName: true } },
          winner: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: [{ round: "asc" }, { matchIndex: "asc" }],
      },
    },
  });

  return NextResponse.json({ tournament: updated });
}