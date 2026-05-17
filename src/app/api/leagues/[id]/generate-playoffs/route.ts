import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (league.adminId !== auth.session.userId && auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (league.playoffGenerated) {
    return NextResponse.json({ error: "Playoffs already generated" }, { status: 409 });
  }
  if (!league.playoffQualifiers || league.playoffQualifiers < 2) {
    return NextResponse.json({ error: "Playoff qualifiers not configured" }, { status: 400 });
  }

  const standings = await prisma.leagueStanding.findMany({
    where: { leagueId: id },
    include: { user: { select: { id: true, username: true, displayName: true } } },
    orderBy: [
      { points: "desc" },
      { goalDifference: "desc" },
      { goalsFor: "desc" },
      { wins: "desc" },
    ],
    take: league.playoffQualifiers,
  });

  if (standings.length < 2) {
    return NextResponse.json({ error: "Need at least 2 qualified players" }, { status: 400 });
  }

  const qualifierIds = standings.map((s) => s.userId);
  const n = qualifierIds.length;
  const size = nextPowerOf2(n);
  const seeded = [...qualifierIds];
  while (seeded.length < size) seeded.push("");
  const seededOrder = seedBracket([...Array(size).keys()]);
  const round1Players = seededOrder.map((i) => seeded[i] || null);

  const type = league.playoffType || "SINGLE_ELIM";
  const matches: {
    leagueId: string;
    round: number;
    matchIndex: number;
    player1Id: string | null;
    player2Id: string | null;
    status: string;
    bracket: string | null;
  }[] = [];

  const wbRounds = Math.log2(size);

  if (type === "DOUBLE_ELIM") {
    for (let i = 0; i < size / 2; i++) {
      const p1 = round1Players[i * 2] || null;
      const p2 = round1Players[i * 2 + 1] || null;
      const hasBye = !p1 || !p2;
      matches.push({
        leagueId: id,
        round: 1,
        matchIndex: i,
        player1Id: p1,
        player2Id: p2,
        status: hasBye ? "PENDING" : (p1 && p2 ? "READY" : "PENDING"),
        bracket: "WB",
      });
    }
    for (let r = 2; r <= wbRounds; r++) {
      const count = size / Math.pow(2, r);
      for (let i = 0; i < count; i++) {
        matches.push({
          leagueId: id,
          round: r,
          matchIndex: i,
          player1Id: null,
          player2Id: null,
          status: "PENDING",
          bracket: "WB",
        });
      }
    }
    if (size >= 4) {
      let lbIdx = 0;
      for (let lb = 1; lb < wbRounds; lb++) {
        const lbCount = Math.pow(2, lb - 1);
        for (let i = 0; i < lbCount; i++) {
          matches.push({
            leagueId: id,
            round: 50 + lb,
            matchIndex: lbIdx,
            player1Id: null,
            player2Id: null,
            status: "PENDING",
            bracket: "LB",
          });
          lbIdx++;
        }
      }
      matches.push({
        leagueId: id,
        round: 50 + wbRounds,
        matchIndex: 0,
        player1Id: null,
        player2Id: null,
        status: "PENDING",
        bracket: "LB",
      });
    }
  } else {
    for (let i = 0; i < size / 2; i++) {
      const p1 = round1Players[i * 2] || null;
      const p2 = round1Players[i * 2 + 1] || null;
      const hasBye = !p1 || !p2;
      matches.push({
        leagueId: id,
        round: 1,
        matchIndex: i,
        player1Id: p1,
        player2Id: p2,
        status: hasBye ? "PENDING" : (p1 && p2 ? "READY" : "PENDING"),
        bracket: null,
      });
    }
    for (let r = 2; r <= wbRounds; r++) {
      const count = size / Math.pow(2, r);
      for (let i = 0; i < count; i++) {
        matches.push({
          leagueId: id,
          round: r,
          matchIndex: i,
          player1Id: null,
          player2Id: null,
          status: "PENDING",
          bracket: null,
        });
      }
    }
  }

  for (const m of matches) {
    if (m.round === 1 && m.player1Id && !m.player2Id) {
      m.status = "COMPLETED";
      const nxt = matches.find(
        (n) => n.bracket === m.bracket && n.round === 2 && n.matchIndex === Math.floor(m.matchIndex / 2),
      );
      if (nxt) {
        if (!nxt.player1Id) nxt.player1Id = m.player1Id;
        else nxt.player2Id = m.player1Id;
        if (nxt.player1Id && nxt.player2Id) nxt.status = "READY";
      }
    }
  }

  await prisma.leaguePlayoffMatch.createMany({ data: matches });
  await prisma.league.update({
    where: { id },
    data: { playoffGenerated: true, status: "LIVE" },
  });

  const playoffMatches = await prisma.leaguePlayoffMatch.findMany({
    where: { leagueId: id },
    include: {
      player1: { select: { id: true, username: true, displayName: true } },
      player2: { select: { id: true, username: true, displayName: true } },
      winner: { select: { id: true, username: true, displayName: true } },
    },
    orderBy: [{ round: "asc" }, { matchIndex: "asc" }],
  });

  return NextResponse.json({ success: true, data: { matches: playoffMatches, qualifiers: standings } });
}
