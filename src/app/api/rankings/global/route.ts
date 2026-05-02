import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const rankings = await prisma.globalClubRanking.findMany({
    include: {
      club: {
        include: {
          manager: { select: { id: true, username: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { rankPosition: "asc" },
  })

  return NextResponse.json({ rankings })
}
