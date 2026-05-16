import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const participant = await prisma.leagueParticipant.findUnique({
    where: { leagueId_userId: { leagueId, userId: auth.session.userId } },
  });
  if (!participant) {
    return NextResponse.json({ error: "Not a participant" }, { status: 404 });
  }

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    select: { adminId: true, status: true },
  });

  if (league?.adminId === auth.session.userId) {
    return NextResponse.json({ error: "League admin cannot leave. Transfer ownership first." }, { status: 400 });
  }

  if (league?.status === "ACTIVE") {
    return NextResponse.json({ error: "Cannot leave an active league. Contact admin." }, { status: 400 });
  }

  await prisma.leagueParticipant.delete({
    where: { leagueId_userId: { leagueId, userId: auth.session.userId } },
  });

  return NextResponse.json({ success: true });
}
