import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";

const CreateTournamentSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  type: z.enum(["KNOCKOUT", "ROUND_ROBIN", "GROUPS"]).default("KNOCKOUT"),
  city: z.string().max(80).optional(),
  prizePool: z.coerce.number().int().min(0).default(0),
  maxPlayers: z.coerce.number().int().min(2).max(256).default(32),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [tournaments, total] = await Promise.all([
    prisma.tournament.findMany({
      where,
      include: {
        organizer: { select: { id: true, username: true, displayName: true } },
        _count: { select: { participants: true } },
      },
      orderBy: [
        { status: "asc" },
        { createdAt: "desc" },
      ],
      skip: offset,
      take: limit,
    }),
    prisma.tournament.count({ where }),
  ]);

  const data = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    type: t.type,
    status: t.status,
    city: t.city,
    prizePool: t.prizePool,
    maxPlayers: t.maxPlayers,
    startAt: t.startAt,
    endAt: t.endAt,
    createdAt: t.createdAt,
    playerCount: t._count.participants,
    organizer: t.organizer,
  }));

  return NextResponse.json({
    tournaments: data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: Request) {
  const auth = await requireRole("ADMIN", "MANAGER");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = CreateTournamentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { startAt, endAt, ...rest } = parsed.data;

  const existing = await prisma.tournament.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  const tournament = await prisma.tournament.create({
    data: {
      ...rest,
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null,
      organizerId: auth.session.userId,
    },
  });

  return NextResponse.json({ tournament }, { status: 201 });
}