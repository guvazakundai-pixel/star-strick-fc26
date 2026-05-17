import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clubId: string; memberId: string }> },
) {
  const { clubId, memberId } = await params;

  const member = await prisma.clubMember.findFirst({
    where: { id: memberId, clubId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          country: true,
          platform: true,
          stats: true,
          playerRanking: { select: { rankPosition: true, prevPosition: true } },
        },
      },
    },
  });

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ member });
}
