import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole("ADMIN", "MANAGER");
  if (!auth.ok) return auth.response;

  try {
    const leagues = await prisma.league.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { _count: { select: { participants: true } } },
    });

    return NextResponse.json({
      leagues: leagues.map((l) => ({
        id: l.id,
        name: l.name,
        type: l.type,
        status: l.status,
        participantCount: l._count.participants,
        maxPlayers: l.maxPlayers,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[AdminLeagues] Failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
