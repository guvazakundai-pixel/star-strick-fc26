import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function genCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;

  const [leagues, total] = await Promise.all([
    prisma.league.findMany({
      where: where as any,
      include: {
        participants: { select: { id: true } },
        admin: { select: { username: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.league.count({ where: where as any }),
  ]);

  const data = leagues.map((l) => ({
    ...l,
    participantCount: l.participants.length,
    participants: undefined,
  }));

  return NextResponse.json({ success: true, data: { leagues: data, total, page, limit } });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { name, description, type, maxPlayers, rounds, homeAway } = body;

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }

  let slug = slugify(name);
  const existing = await prisma.league.findUnique({ where: { slug } });
  if (existing) slug = slug + "-" + Date.now().toString(36);

  const inviteCode = genCode();

  const league = await prisma.league.create({
    data: {
      name: name.trim(),
      slug,
      description: description || null,
      type: type || "PUBLIC",
      maxPlayers: maxPlayers || 20,
      rounds: rounds || 2,
      homeAway: homeAway !== false,
      inviteCode,
      status: "REGISTRATION",
      adminId: auth.session.userId,
      seasons: {
        create: { seasonNumber: 1, status: "ACTIVE" },
      },
    },
    include: {
      seasons: { take: 1, orderBy: { seasonNumber: "desc" } },
      admin: { select: { username: true, displayName: true } },
    },
  });

  return NextResponse.json({ success: true, data: league }, { status: 201 });
}
