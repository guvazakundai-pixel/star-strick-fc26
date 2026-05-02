import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params

  const stats = await prisma.playerStats.findUnique({
    where: { userId: playerId },
  })

  if (!stats) {
    return NextResponse.json({ stats: null })
  }

  return NextResponse.json({ stats })
}
