import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const inviteCode = code.toUpperCase();

  const league = await prisma.league.findUnique({
    where: { inviteCode },
    select: { id: true, name: true, type: true },
  });

  const club = await prisma.club.findUnique({
    where: { joinCode: inviteCode },
    select: { id: true, name: true, tag: true },
  });

  if (league) {
    return NextResponse.json({ success: true, data: { leagueId: league.id, name: league.name, type: "LEAGUE" } });
  }

  if (club) {
    return NextResponse.json({ success: true, data: { clubId: club.id, name: club.name, tag: club.tag, type: "CLUB" } });
  }

  return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
}
