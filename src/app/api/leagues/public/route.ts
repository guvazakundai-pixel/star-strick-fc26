import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const [leagues, total] = await Promise.all([
    prisma.league.findMany({
      where: { type: "PUBLIC" },
      include: {
        _count: { select: { participants: true } },
        admin: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.league.count({ where: { type: "PUBLIC" } }),
  ]);

  return NextResponse.json({
    success: true,
    data: { leagues, total, page, limit },
  });
}
