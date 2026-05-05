import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const search = searchParams.get("q") ?? "";

  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { tag: { contains: search.toUpperCase() } },
        ],
      }
    : {};

  const [clubs, total] = await Promise.all([
    prisma.club.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        tag: true,
        logoUrl: true,
        city: true,
        country: true,
        isVerified: true,
        isInviteOnly: true,
        _count: { select: { members: { where: { status: "APPROVED" } } } },
        globalRanking: { select: { rankPosition: true, totalPoints: true } },
      },
    }),
    prisma.club.count({ where }),
  ]);

  return NextResponse.json({
    clubs: clubs.map((c) => ({
      ...c,
      memberCount: c._count.members,
      _count: undefined,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}