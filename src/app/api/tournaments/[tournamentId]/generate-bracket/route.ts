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

  // Seed bracket using standard seeding (1v16, 8v9, etc.)
  const bracketOrder: number[] = [];
  for (let i = 0; i < size; i++) bracketOrder.push(i);
  const seededOrder = seedBracket(bracketOrder);
  const round1Players = seededOrder.map((i) => seeded[i] || null);

  // Round 1 matches
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

  // Subsequent rounds (empty slots until previous round completes)
  for (let r = 2; r <= totalRounds; r++) {
    const matchesInRound = size / Math.pow(2, r);
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        round: r,
        matchIndex: i,
        player1Id: null,
        player2Id: null,
        status: "PENDING",
      });
    }
  }

  // Auto-advance byes
  for (const match of matches) {
    if (match.round === 1 && match.player1Id && !match.player2Id) {
      // Bye: auto-advance player1
      match.status = "COMPLETED";
      // Find next round match to place them
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

  // Create all matches
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
  if (places.length === 1) return places;
  if (places.length === 2) return [places[0], places[1]];
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
  // Add bye if odd number
  const hasBye = n % 2 !== 0;
  if (hasBye) players.push("");

  const totalRounds = players.length - 1;
  const matchesPerRound = Math.floor(players.length / 2);
  let matchIndex = 0;

  // Circle method for round-robin scheduling
  const fixed = players[0];
  const rotating = players.slice(1);

  for (let round = 1; round <= totalRounds; round++) {
    const roundPlayers = [fixed, ...rotating];

    for (let m = 0; m < matchesPerRound; m++) {
      const p1 = roundPlayers[m];
      const p2 = roundPlayers[roundPlayers.length - 1 - m];

      const player1Id = p1 || null;
      const player2Id = p2 || null;

      if (!player1Id || !player2Id) {
        // Bye match, skip
        continue;
      }

      await prisma.tournamentMatch.create({
        data: {
          tournamentId,
          round,
          matchIndex,
          player1Id,
          player2Id,
          status: "READY",
        },
      });
      matchIndex++;
    }

    // Rotate for next round
    const last = rotating.pop()!;
    rotating.unshift(last);
  }
}

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
    if (tournament.type === "KNOCKOUT") {
      await generateKnockoutBracket(tournamentId, participantIds);
    } else if (tournament.type === "ROUND_ROBIN") {
      await generateRoundRobin(tournamentId, participantIds);
    } else {
      return NextResponse.json({ error: "GROUPS bracket generation not yet implemented" }, { status: 501 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bracket generation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Update tournament status to LIVE
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "LIVE" },
  });

  // Mark active participants
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