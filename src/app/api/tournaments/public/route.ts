import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { status: { in: ["REGISTRATION", "LIVE"] } },
      include: {
        _count: { select: { participants: true } },
        organizer: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ success: true, data: tournaments });
  } catch (error) {
    return NextResponse.json({ success: true, data: [] });
  }
}
