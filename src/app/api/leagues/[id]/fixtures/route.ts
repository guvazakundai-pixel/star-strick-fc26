import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const matchday = searchParams.get("matchday") ? parseInt(searchParams.get("matchday")!) : undefined;

  const where: Record<string, unknown> = { leagueId: id };
  if (matchday) where.matchday = matchday;

  const fixtures = await prisma.leagueFixture.findMany({
    where: where as any,
    include: {
      homeUser: { select: { id: true, username: true, displayName: true } },
      awayUser: { select: { id: true, username: true, displayName: true } },
    },
    orderBy: [{ matchday: "asc" }, { createdAt: "asc" }],
  });

  const totalMatchdays = fixtures.length > 0
    ? Math.max(...fixtures.map((f) => f.matchday))
    : 0;

  return NextResponse.json({ success: true, data: { fixtures, totalMatchdays } });
}
