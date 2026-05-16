import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { generateInviteCode, DEFAULT_LEAGUE_SETTINGS } from "@/lib/league-engine";

const CreateLeagueSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(1000).optional(),
  type: z.enum(["PUBLIC", "PRIVATE", "FRIENDS"]).default("PUBLIC"),
  maxPlayers: z.number().int().min(4).max(32).default(16),
  logoUrl: z.string().url().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const search = searchParams.get("q") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const offset = (page - 1) * limit;

  const where: any = {};
  if (type && ["PUBLIC", "PRIVATE", "FRIENDS"].includes(type)) where.type = type;
  if (search) where.name = { contains: search };

  const [leagues, total] = await Promise.all([
    prisma.league.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        admin: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        _count: { select: { participants: true, fixtures: true } },
      },
    }),
    prisma.league.count({ where }),
  ]);

  return NextResponse.json({
    leagues: leagues.map((l) => ({
      ...l,
      settings: l.settings ? JSON.parse(l.settings) : DEFAULT_LEAGUE_SETTINGS,
      participantCount: l._count.participants,
      fixtureCount: l._count.fixtures,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = CreateLeagueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, description, type, maxPlayers, logoUrl } = parsed.data;

  const existing = await prisma.league.findFirst({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "A league with this name already exists" }, { status: 409 });
  }

  let inviteCode: string | undefined;
  if (type !== "PUBLIC") {
    inviteCode = generateInviteCode();
    while (await prisma.league.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
    }
  }

  const league = await prisma.league.create({
    data: {
      name,
      description,
      type,
      maxPlayers,
      logoUrl,
      inviteCode,
      adminId: auth.session.userId,
      settings: JSON.stringify(DEFAULT_LEAGUE_SETTINGS),
      participants: {
        create: {
          userId: auth.session.userId,
        },
      },
      season: {
        create: {
          number: 1,
          status: "PENDING",
        },
      },
    },
    include: {
      admin: { select: { id: true, username: true, displayName: true } },
      _count: { select: { participants: true } },
    },
  });

  return NextResponse.json({
    league: {
      ...league,
      settings: DEFAULT_LEAGUE_SETTINGS,
      participantCount: league._count.participants,
    },
  }, { status: 201 });
}
