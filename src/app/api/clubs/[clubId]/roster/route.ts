import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;

  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { id: true } });
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const members = await prisma.clubMember.findMany({
    where: { clubId, status: "APPROVED" },
    orderBy: [{ clubXp: "desc" }, { role: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          country: true,
          platform: true,
          stats: {
            select: {
              points: true,
              wins: true,
              losses: true,
              draws: true,
              goalsScored: true,
              goalsConceded: true,
              skillRating: true,
              winStreak: true,
              formHistory: true,
            },
          },
          playerRanking: {
            select: { rankPosition: true, prevPosition: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ members });
}
