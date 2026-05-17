import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole("ADMIN", "MANAGER");
  if (!auth.ok) return auth.response;

  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { _count: { select: { participants: true } } },
    });

    return NextResponse.json({
      tournaments: tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        status: t.status,
        participantCount: t._count.participants,
        maxPlayers: t.maxPlayers,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[AdminTournaments] Failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
