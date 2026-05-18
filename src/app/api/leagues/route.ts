import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

const CreateLeagueSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, dashes only"),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  region: z.string().max(80).optional(),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).default("PUBLIC"),
  format: z.enum(["ROUND_ROBIN", "DOUBLE_RR", "LADDER", "GROUPS"]).default("ROUND_ROBIN"),
  maxPlayers: z.coerce.number().int().min(2).max(64).default(16),
  joinPolicy: z.enum(["OPEN", "INVITE", "APPROVAL", "PASSWORD"]).default("INVITE"),
  joinPassword: z.string().min(3).max(64).optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const visibility = searchParams.get("visibility") ?? "PUBLIC";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = { visibility };
  if (status) where.status = status;

  const [leagues, total] = await Promise.all([
    prisma.league.findMany({
      where,
      include: {
        owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        seasons: {
          orderBy: { seasonNumber: "desc" },
          take: 1,
          select: {
            id: true,
            seasonNumber: true,
            phase: true,
            _count: { select: { participants: true, fixtures: true } },
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
    }),
    prisma.league.count({ where }),
  ]);

  return NextResponse.json({
    leagues,
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
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.league.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  if (parsed.data.joinPolicy === "PASSWORD" && !parsed.data.joinPassword) {
    return NextResponse.json(
      { error: "joinPassword required when joinPolicy is PASSWORD" },
      { status: 400 },
    );
  }

  const { joinPassword, ...rest } = parsed.data;
  const joinPasswordHash = joinPassword ? await bcrypt.hash(joinPassword, 10) : null;

  const league = await prisma.league.create({
    data: {
      ...rest,
      joinPasswordHash,
      ownerId: auth.session.userId,
    },
  });

  return NextResponse.json({ league }, { status: 201 });
}
