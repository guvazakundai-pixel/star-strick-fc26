import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

const CreateSchema = z.object({
  player1Id: z.string().min(1),
  player2Id: z.string().min(1),
  clubId: z.string().optional(),
  score1: z.number().int().min(0).default(0),
  score2: z.number().int().min(0).default(0),
  notes: z.string().max(1000).optional(),
});

const playerSelect = { id: true, username: true, displayName: true, avatarUrl: true } as const;
const playerSelectShort = { id: true, username: true, displayName: true } as const;
const clubSelect = { id: true, name: true, tag: true } as const;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const playerId = searchParams.get("player");
  const clubId = searchParams.get("club");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const offset = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (playerId) {
    where.OR = [{ player1Id: playerId }, { player2Id: playerId }];
  }
  if (clubId) where.clubId = clubId;

  const [matches, total] = await Promise.all([
    prisma.matchReport.findMany({
      where,
      include: {
        player1: { select: playerSelect },
        player2: { select: playerSelect },
        winner: { select: playerSelectShort },
        club: { select: clubSelect },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.matchReport.count({ where }),
  ]);

  return NextResponse.json({
    matches,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { player1Id, player2Id, clubId, score1, score2, notes } = parsed.data;

  if (player1Id === player2Id) {
    return NextResponse.json({ error: "Players must be different" }, { status: 400 });
  }

  const [p1, p2] = await Promise.all([
    prisma.user.findUnique({ where: { id: player1Id }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: player2Id }, select: { id: true } }),
  ]);
  if (!p1 || !p2) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  let winnerId: string | null = null;
  if (score1 > score2) winnerId = player1Id;
  else if (score2 > score1) winnerId = player2Id;

  const match = await prisma.matchReport.create({
    data: {
      player1Id,
      player2Id,
      clubId: clubId ?? null,
      score1,
      score2,
      winnerId,
      status: "PENDING",
      statusRaw: "PENDING",
      notes: notes ?? null,
      submittedById: auth.session.userId,
    },
    include: {
      player1: { select: playerSelect },
      player2: { select: playerSelect },
      winner: { select: playerSelectShort },
    },
  });

  return NextResponse.json({ match }, { status: 201 });
}